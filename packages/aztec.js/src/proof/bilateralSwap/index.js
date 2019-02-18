/**
 * Constructs AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proof
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const Keccak = require('../../keccak');
const bn128 = require('../../bn128');

const helpers = require('./helpers');
const verifier = require('./verifier');

const { groupReduction } = bn128;

const bilateralSwap = {};
bilateralSwap.helpers = helpers;
bilateralSwap.verifier = verifier;


/**
 * Compute the Fiat-Shamir heuristic-ified challenge variable.
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method computeChallenge
 * @param {string} sender Ethereum address of transaction sender
 * @param {number} m number of input notes
 * @param {Object[]} notes array of AZTEC notes
 * @param {Object[]} blindingFactors array of computed blinding factors, one for each note
 */
bilateralSwap.computeChallenge = (...challengeVariables) => {
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
 * Construct AZTEC bilateral swap proof transcript
 *
 * @method constructProof
 * @param {Note[]} notes array of AZTEC notes
 * @returns {{ proofData: string[], challenge: string }} - proof data and challenge
 */
bilateralSwap.constructBilateralSwap = (notes, sender) => {
    const bkArray = [];
    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        /*
        Explanation of the below if/else
        - The purpose is to set bk1 = bk3 and bk2 = bk4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the bkArray, and setting the current
          bk equal to the element at the resulting position.
        */

        // Maker notes
        if (i <= 1) {
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        } else { // taker notes
            bk = bkArray[i - 2];
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });

    const challenge = bilateralSwap.computeChallenge(sender, notes, blindingFactors);

    const proofData = blindingFactors.map((blindingFactor, i) => {
        let kBar;

        if (i <= 1) {
            kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        } else {
            kBar = 0;
        }

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

module.exports = bilateralSwap;
