/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const Keccak = require('../keccak/keccak');
const bn128 = require('../bn128/bn128');
const { K_MAX } = require('../params');

const { groupReduction } = bn128;

const proof = {};

/**
 * Generate random blinding scalars, conditional on the AZTEC join-split proof statement
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method generateBlindingScalars
 * @param {Number} n number of notes
 * @param {Number} m number of input notes
 */
proof.generateBlindingScalars = (n, m) => {
    let runningBk = new BN(0).toRed(groupReduction);
    const scalars = [...Array(n)].map((v, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        if (i === (n - 1)) {
            if (n === m) {
                bk = new BN(0).toRed(groupReduction).redSub(runningBk);
            } else {
                bk = runningBk;
            }
        }

        if ((i + 1) > m) {
            runningBk = runningBk.redSub(bk);
        } else {
            runningBk = runningBk.redAdd(bk);
        }
        return { bk, ba };
    });
    return scalars;
};

/**
 * Compute the Fiat-Shamir heuristic-ified challenge variable.
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method computeChallenge
 * @param {String} sender Ethereum address of transaction sender
 * @param {String} kPublic public commitment being added to proof
 * @param {Number} m number of input notes
 * @param {Object[]} notes array of AZTEC notes
 * @param {Object[]} blindingFactors array of computed blinding factors, one for each note
 */
proof.computeChallenge = (sender, kPublic, m, notes, blindingFactors) => {
    const hash = new Keccak();
    hash.appendBN(new BN(sender.slice(2), 16)); // add message sender to hash
    hash.appendBN(kPublic.umod(bn128.n)); // add kPublic to hash
    hash.appendBN(new BN(m)); // add input note variable to hash
    notes.forEach((note) => {
        hash.append(note.gamma);
        hash.append(note.sigma);
    });
    blindingFactors.forEach(({ B }) => {
        hash.append(B);
    });
    hash.keccak();
    return hash.toGroupScalar(groupReduction);
};

function isOnCurve(point) {
    const lhs = point.y.redSqr();
    const rhs = point.x.redSqr().redMul(point.x).redAdd(bn128.b);
    return (lhs.fromRed().eq(rhs.fromRed()));
}

/**
 * Validate proof inputs are well formed
 *
 * @method parseInputs
 * @param {Object[]} notes array of AZTEC notes
 * @param {Number} m number of input notes
 * @param {String} sender Ethereum address of transaction sender
 * @param {String} kPublic public commitment being added to proof
 */
proof.parseInputs = (notes, m, sender, kPublic) => {
    notes.forEach((note) => {
        if (!note.a.fromRed().lt(bn128.n) || note.a.fromRed().eq(new BN(0))) {
            throw new Error('viewing key malformed');
        }
        if (!note.k.fromRed().lt(new BN(K_MAX))) {
            throw new Error('note value malformed');
        }
        if (note.gamma.isInfinity()) {
            throw new Error('gamma at infinity');
        }
        if (note.sigma.isInfinity()) {
            throw new Error('sigma at infinity');
        }
        if (!isOnCurve(note.gamma)) {
            throw new Error('gamma not on curve');
        }
        if (!isOnCurve(note.sigma)) {
            throw new Error('sigma not on curve');
        }
    });

    if (!kPublic.lt(bn128.n)) {
        throw new Error('kPublic value malformed');
    }
    if (m > notes.length) {
        throw new Error('m is greater than note array length');
    }
};

/**
 * Construct AZTEC join-split proof transcript
 *
 * @method constructJoinSplit
 * @param {Object[]} notes array of AZTEC notes
 * @param {Number} m number of input notes
 * @param {String} sender Ethereum address of transaction sender
 * @param {String} kPublic public commitment being added to proof
 * @returns {Object} proof data and challenge
 */
proof.constructJoinSplit = (notes, m, sender, kPublic = 0) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();
    // convert kPublic into a BN instance if it is not one
    let kPublicBn;
    if (BN.isBN(kPublic)) {
        kPublicBn = kPublic;
    } else if (kPublic < 0) {
        kPublicBn = bn128.n.sub(new BN(-kPublic));
    } else {
        kPublicBn = new BN(kPublic);
    }
    proof.parseInputs(notes, m, sender, kPublicBn);

    // construct initial hash of note commitments
    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });
    // finalHash is used to create final proof challenge
    rollingHash.keccak(); // create first iteration of rollingHash

    // define 'running' blinding factor for the k-parameter in final note
    let runningBk = new BN(0).toRed(groupReduction);

    const blindingScalars = proof.generateBlindingScalars(notes.length, m);

    const blindingFactors = notes.map((note, i) => {
        let B;
        let x = new BN(0).toRed(groupReduction);
        const { bk, ba } = blindingScalars[i];
        if ((i + 1) > m) {
            x = rollingHash.toGroupScalar(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            runningBk = runningBk.redSub(bk);
            rollingHash.keccak();
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
        } else {
            runningBk = runningBk.redAdd(bk);
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }
        return {
            bk,
            ba,
            B,
            x,
        };
    });

    const challenge = proof.computeChallenge(sender, kPublicBn, m, notes, blindingFactors);

    const proofData = blindingFactors.map((blindingFactor, i) => {
        let kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        const aBar = ((notes[i].a.redMul(challenge)).redAdd(blindingFactor.ba)).fromRed();
        if (i === (notes.length - 1)) {
            kBar = kPublicBn;
        }
        return [
            `0x${padLeft(kBar.toString(16), 64)}`,
            `0x${padLeft(aBar.toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.y.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.y.fromRed().toString(16), 64)}`,
        ];
    });
    return {
        proofData,
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

module.exports = proof;
