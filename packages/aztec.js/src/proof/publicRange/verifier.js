const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const proofUtils = require('../proofUtils');

const { groupReduction } = bn128;
const { errorTypes, K_MAX } = utils.constants;

const verifier = {};

/**
 * Verify AZTEC dividend computation proof transcript
 *
 * @method verifyProof
 * @memberof module:publicRange
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {string} challenge - challenge variable used in zero-knowledge protocol
 * @param {string} sender - Ethereum address
 * @param {Number} u - public integer being compared against
 * @returns {boolean} valid - boolean that describes whether the proof verification is valid
 * @returns {option} errors - an array of all errors that were caught
 */
verifier.verifyProof = (proofData, challengeHex, sender, u) => {
    const errors = [];

    let uBN;
    const K_MAXBN = new BN(K_MAX);
    const kBarArray = [];
    const numNotes = 2;

    // Used to check the number of notes. Boolean argument specifies whether the
    // check should throw if not satisfied, or if we seek to collect all errors
    // and only throw at the end. Here, set to false - only throw at end
    proofUtils.checkNumNotes(proofData, numNotes, false, errors);

    // convertToBNAndAppendPoints appends gamma and sigma to the end of proofdata as well
    const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData, errors);

    const challenge = new BN(challengeHex.slice(2), 16).toRed(groupReduction);

    // convert to bn.js instances if not already
    if (BN.isBN(u)) {
        uBN = u.toRed(groupReduction);
    } else {
        uBN = new BN(u).toRed(groupReduction);
    }

    // Check that u is less than k_max
    if (uBN.gte(K_MAXBN)) {
        errors.push(errorTypes.U_TOO_BIG);
    }
    const rollingHash = new Keccak();
    // Append note data to rollingHash
    proofDataBn.forEach((proofElement) => {
        rollingHash.append(proofElement[6]);
        rollingHash.append(proofElement[7]);
    });

    // Create finalHash and append to it - in same order as the proof construction code (otherwise final hash will be different)
    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(uBN);
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        if (i === 0) {
            // input note
            B = gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma.mul(challenge).neg());
            kBarArray.push(kBar);
        }

        if (i === 1) {
            // output note
            const firstTerm = kBarArray[0];
            const secondTerm = challenge.mul(uBN);
            kBar = firstTerm.sub(secondTerm);

            B = gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma.mul(challenge).neg());
            kBarArray.push(kBar);
        }

        if (B === null) {
            errors.push(errorTypes.BLINDING_FACTOR_IS_NULL);
        } else if (B.isInfinity()) {
            errors.push(errorTypes.BAD_BLINDING_FACTOR);
            finalHash.appendBN(new BN(0));
            finalHash.appendBN(new BN(0));
        } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
            errors.push(errorTypes.BAD_BLINDING_FACTOR);
            finalHash.append(B);
        } else {
            finalHash.append(B);
        }

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
