/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof.mint
 */

const { constants: { K_MAX } } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const helpers = require('./helpers');
const verifier = require('./verifier');

const abiEncoder = require('../../abiEncoder');
const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const sign = require('../../sign');

const { groupReduction } = bn128;
const { outputCoder, inputCoder } = abiEncoder;
const mintEncode = inputCoder.mint;


const mint = {};
mint.helpers = helpers;
mint.verifier = verifier;

/**
 * Generate random blinding scalars, conditional on the AZTEC join-split proof statement
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method generateBlindingScalars
 * @memberof proof.joinSplit
 * @param {number} n number of notes
 * @param {number} m number of input notes
 */
mint.generateBlindingScalars = (n) => {
    const m = 1;
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
 * @memberof proof.mint
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 * @param {number} m number of input notes
 * @param {Object[]} notes array of AZTEC notes
 * @param {Object[]} blindingFactors array of computed blinding factors, one for each note
 */
mint.computeChallenge = (...challengeVariables) => {
    const hash = new Keccak();

    const recurse = (inputs) => {
        inputs.forEach((challengeVar) => {
            if (typeof (challengeVar) === 'string') {
                hash.appendBN(new BN(challengeVar.slice(2), 16));
            } else if (typeof (challengeVar) === 'number') {
                hash.appendBN(new BN(challengeVar));
            } else if (BN.isBN(challengeVar)) {
                hash.appendBN(challengeVar.umod(bn128.curve.n));
            } else if (Array.isArray(challengeVar)) {
                recurse(challengeVar);
            } else if (challengeVar.gamma) {
                hash.append(challengeVar.gamma);
                hash.append(challengeVar.sigma);
            } else if (challengeVar.B) {
                hash.append(challengeVar.B);
            } else {
                throw new Error(`I don't know how to add ${challengeVar} to hash`);
            }
        });
    };
    recurse(challengeVariables);

    return hash.keccak(groupReduction);
};

function isOnCurve(point) {
    const lhs = point.y.redSqr();
    const rhs = point.x.redSqr().redMul(point.x).redAdd(bn128.curve.b);
    return (lhs.fromRed().eq(rhs.fromRed()));
}

/**
 * Validate proof inputs are well formed
 *
 * @method parseInputs
 * @memberof proof.mint
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 */
mint.parseInputs = (notes, sender, kPublic) => {
    notes.forEach((note) => {
        if (!note.a.fromRed().lt(bn128.curve.n) || note.a.fromRed().eq(new BN(0))) {
            throw new Error('viewing key malformed');
        }
        if (!note.k.fromRed().lt(new BN(K_MAX))) {
            throw new Error('note value malformed');
        }
        if (note.gamma.isInfinity() || note.sigma.isInfinity()) {
            throw new Error('point at infinity');
        }
        if (!isOnCurve(note.gamma) || !isOnCurve(note.sigma)) {
            throw new Error('point not on curve');
        }
    });

    if (!kPublic.lt(bn128.curve.n)) {
        throw new Error('kPublic value malformed');
    }
};

/**
 * Construct AZTEC mint proof transcript
 *
 * @method constructProof
 * @memberof proof.mint
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 * @returns {Object} proof data and challenge
 */
mint.constructProof = (notes, sender, kPublic) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();
    // convert kPublic into a BN instance if it is not one
    let kPublicBn;
    if (BN.isBN(kPublic)) {
        kPublicBn = kPublic;
    } else if (kPublic < 0) {
        kPublicBn = bn128.curve.n.sub(new BN(-kPublic));
    } else {
        kPublicBn = new BN(kPublic);
    }
    mint.parseInputs(notes, sender, kPublicBn);

    // construct initial hash of note commitments
    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    // define 'running' blinding factor for the k-parameter in final note
    let runningBk = new BN(0).toRed(groupReduction);

    const blindingScalars = mint.generateBlindingScalars(notes.length);

    const blindingFactors = notes.map((note, i) => {
        let B;
        let x = new BN(0).toRed(groupReduction);
        const { bk, ba } = blindingScalars[i];
        const m = 1;
        if ((i + 1) > m) {
            // get next iteration of our rolling hash
            x = rollingHash.keccak(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            runningBk = runningBk.redSub(bk);
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

    const challenge = mint.computeChallenge(sender, kPublicBn, notes, blindingFactors);

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


/**
 * Construct AZTEC join-split proof transcript. This one rolls `publicOwner` into the hash
 *
 * @method constructProof
 * @memberof proof.mint
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 * @returns {Object} proof data and challenge
 */
mint.constructProofModified = (notes, sender, kPublic, publicOwner) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();
    // convert kPublic into a BN instance if it is not one
    let kPublicBn;
    if (BN.isBN(kPublic)) {
        kPublicBn = kPublic;
    } else if (kPublic < 0) {
        kPublicBn = bn128.curve.n.sub(new BN(-kPublic));
    } else {
        kPublicBn = new BN(kPublic);
    }
    mint.parseInputs(notes, sender, kPublicBn);

    // construct initial hash of note commitments
    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    // define 'running' blinding factor for the k-parameter in final note
    let runningBk = new BN(0).toRed(groupReduction);

    const blindingScalars = mint.generateBlindingScalars(notes.length);

    const blindingFactors = notes.map((note, i) => {
        let B;
        let x = new BN(0).toRed(groupReduction);
        const { bk, ba } = blindingScalars[i];
        const m = 1;
        if ((i + 1) > m) {
            // get next iteration of our rolling hash
            x = rollingHash.keccak(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);
            runningBk = runningBk.redSub(bk);
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

    const challenge = mint.computeChallenge(sender, kPublicBn, publicOwner, notes, blindingFactors);

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

/**
 * Encode a join split transaction
 * 
 * @method encodeMintTransaction
 * @memberof module:proof.mint.helpers
 * @param {Object} values
 * @param {Note[]} inputNotes input AZTEC notes
 * @param {Note[]} outputNotes output AZTEC notes
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string[]} inputNoteOwners array with the owners of the input notes
 * @param {string} publicOwner address(0x0) or the holder of a public token being converted
 * @param {string} kPublic public commitment being added to proof
 * @param {string} validatorAddress address of the mint contract
 * @returns {Object} AZTEC proof data and expected output
 */
mint.encodeMintTransaction = ({
    inputNotes,
    outputNotes,
    senderAddress,
    inputNoteOwners,
    publicOwner,
    kPublic,
    validatorAddress,
}) => {
    const m = inputNotes.length;
    const {
        proofData: proofDataRaw,
        challenge,
    } = mint.constructMintModified([...inputNotes, ...outputNotes], senderAddress, kPublic, publicOwner);

    const inputSignatures = inputNotes.map((inputNote, index) => {
        const { privateKey } = inputNoteOwners[index];
        return sign.signACENote(
            proofDataRaw[index],
            challenge,
            senderAddress,
            validatorAddress,
            privateKey
        );
    });
    const outputOwners = outputNotes.map(n => n.owner);
    const proofData = mintEncode(
        proofDataRaw,
        m,
        challenge,
        publicOwner,
        inputSignatures,
        outputOwners,
        outputNotes
    );
    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue: kPublic,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
};

module.exports = mint;
