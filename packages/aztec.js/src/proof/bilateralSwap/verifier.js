/**
 * Verifies AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proof
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const helpers = require('./helpers');
const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const proofUtils = require('../proofUtils');

const verifier = {};
const { ERROR_TYPES } = utils.constants;
const { groupReduction } = bn128;

/**
 * Verify AZTEC bilateral swap proof transcript
 *
 * @method verifyBilateralSwap
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {BN} challenge - challenge variable used in zero-knowledge protocol 
 * @returns {number} - returns 1 if proof is validated, throws an error if not
 */
verifier.verifyBilateralSwap = (proofData, challengeHex, sender) => {
    const errors = [];

    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);

    const proofDataBn = helpers.toBnAndAppendPoints(proofData);

    const finalHash = new Keccak();

    finalHash.appendBN(new BN(sender.slice(2), 16));

    proofDataBn.forEach((proofElement) => {
        finalHash.append(proofElement[6]);
        finalHash.append(proofElement[7]);
    });

    const kBarArray = [];

    proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        // Only check these conditions for the input notes, because
        // the output notes initially have kBar set to 0 
        // (we set the value of kBar later using a cryptographic relation
        // unique to bilateral swaps)

        if (i <= 1) {
            // Check if the scalar kBar is zero, if it is then throw
            if (kBar.fromRed().eq(new BN(0))) {
                errors.push(ERROR_TYPES.SCALAR_IS_ZERO);
            }

            // Check if the scalar aBar is zero, if it is then throw
            if (aBar.fromRed().eq(new BN(0))) {
                errors.push(ERROR_TYPES.SCALAR_IS_ZERO);
            }
        }

        /*
        Explanation of the below if/else
        - The purpose is to set kBar1 = kBar3 and kBar2 = kBar4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All kBars are stored in a kBarArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding 
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the kBarArray, and setting the current
          kBar equal to the element at the resulting position.
        */

        // Maker notes
        if (i <= 1) {
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(challenge).neg());
        } else { // taker notes
            kBar = kBarArray[i - 2];
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(challenge).neg());
        }

        if (B.isInfinity()) {
            errors.push(ERROR_TYPES.BAD_BLINDING_FACTOR);
            finalHash.appendBN(new BN(0));
            finalHash.appendBN(new BN(0));
        } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
            errors.push(ERROR_TYPES.BAD_BLINDING_FACTOR);
            finalHash.append(B);
        } else {
            finalHash.append(B);
        }

        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(groupReduction);
    const finalChallenge = `0x${padLeft(recoveredChallenge.toString(16), 64)}`;

    // Check if the recovered challenge, matches the original challenge. If so, proof construction is validated
    if (finalChallenge !== challengeHex) {
        errors.push(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
    }

    const valid = errors.length === 0;
    return {
        valid,
        errors,
    };
};

module.exports = verifier;
