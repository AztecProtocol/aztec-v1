const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const proofUtils = require('../proofUtils');

const verifier = {};
const { errorTypes } = utils.constants;
const { groupReduction } = bn128;

/**
 * Verify AZTEC bilateral swap proof transcript
 *
 * @method verifyProof
 * @memberof module:bilateralSwap
 * @param {Object[]} proofData - AZTEC bilateralSwap zero-knowledge proof data
 * @param {string} challengeHex - hex-string formatted proof challenge
 * @param {string} sender - Ethereum address of transaction sender
 * @returns {boolean} valid - boolean that describes whether the proof verification is valid
 * @returns {string[]} errors - an array of all errors that were caught
 */
verifier.verifyProof = (proofData, challengeHex, sender) => {
    const errors = [];

    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);

    const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData, errors);

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
            errors.push(errorTypes.BAD_BLINDING_FACTOR);
            finalHash.appendBN(new BN(0));
            finalHash.appendBN(new BN(0));
        } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
            errors.push(errorTypes.BAD_BLINDING_FACTOR);
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
        errors.push(errorTypes.CHALLENGE_RESPONSE_FAIL);
    }

    const valid = errors.length === 0;
    return {
        valid,
        errors,
    };
};

module.exports = verifier;
