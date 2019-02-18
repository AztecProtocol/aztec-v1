/**
 * Verifies AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proof
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');

const { customError } = utils.errors;
const { ERROR_TYPES } = utils.constants;

const helpers = require('./helpers');

const { groupReduction } = bn128;

const verifier = {};


/**
 * Verify AZTEC bilateral swap proof transcript
 *
 * @method verifyBilateralSwap
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {BN} challenge - challenge variable used in zero-knowledge protocol 
 * @returns {number} - returns 1 if proof is validated, throws an error if not
 */
verifier.verifyBilateralSwap = (proofData, challenge, sender) => {
    const proofDataBn = helpers.toBnAndAppendPoints(proofData);
    const formattedChallenge = new BN(challenge.slice(2), 16);

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
        // the output notes automatically have kBar set to 0

        if (i <= 1) {
            // Check if the scalar kBar is zero, if it is then throw
            if (kBar.fromRed().eq(new BN(0))) {
                throw customError(
                    ERROR_TYPES.SCALAR_IS_ZERO,
                    {
                        data: 'kBar is equal to 0',
                    }
                );
            }

            // Check if the scalar aBar is zero, if it is then throw
            if (aBar.fromRed().eq(new BN(0))) {
                throw customError(
                    ERROR_TYPES.SCALAR_IS_ZERO,
                    {
                        data: 'aBar is equal to 0',
                    }
                );
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
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());
        } else { // taker notes
            kBar = kBarArray[i - 2];
            B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());
        }

        if (B.isInfinity()) {
            throw customError(
                ERROR_TYPES.BAD_BLINDING_FACTOR,
                {
                    data: 'The blinding factor is infinity',
                }
            );
        }

        finalHash.append(B);
        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(groupReduction);
    const finalChallenge = `0x${padLeft(recoveredChallenge.toString(16), 64)}`;

    // Check if the recovered challenge, matches the original challenge. If so, proof construction is validated
    if (finalChallenge !== challenge) {
        throw customError(
            ERROR_TYPES.PROOF_FAILED,
            {
                data: `The recovered challenge is not equal to the original
                          challenge. Proof verification has failed`,
            }
        );
    } else {
        return true;
    }
};

module.exports = verifier;
