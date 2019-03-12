/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof.mint
 */

const { constants: { K_MAX } } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const verifier = require('./verifier');
const proofUtils = require('../proofUtils');

const abiEncoder = require('../../abiEncoder');
const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const sign = require('../../sign');

const { groupReduction } = bn128;
const { outputCoder, inputCoder } = abiEncoder;
const mintEncode = inputCoder.mint;


const mint = {};
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

/**
 * Construct AZTEC mint proof transcript
 *
 * @method constructProof
 * @memberof proof.mint
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @returns {Object} proof data and challenge
 */
mint.constructProof = (notes, sender) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();

    proofUtils.parseInputs(notes, sender);

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

    const challenge = mint.computeChallenge(sender, notes, blindingFactors);

    const proofData = blindingFactors.map((blindingFactor, i) => {
        const kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        const aBar = ((notes[i].a.redMul(challenge)).redAdd(blindingFactor.ba)).fromRed();

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

module.exports = mint;
