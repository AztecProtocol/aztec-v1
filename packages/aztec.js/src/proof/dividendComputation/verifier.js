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
 * @memberof module:dividendComputation
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {string} challenge - challenge variable used in zero-knowledge protocol
 * @param {string} sender - Ethereum address
 * @param {integer} za - integer required to represent ratio in a compatible form with finite-field arithmetic
 * @param {integer} zb - integer required to represent ratio in a compatible form with finite-field arithmetic
 * @returns {boolean} valid - boolean that describes whether the proof verification is valid
 * @returns {option} errors - an array of all errors that were caught
 */
verifier.verifyProof = (proofData, challenge, sender, za, zb) => {
    const errors = [];

    let zaBN;
    let zbBN;
    const K_MAXBN = new BN(K_MAX);
    const kBarArray = [];
    const numNotes = 3;

    // Used to check the number of notes. Boolean argument specifies whether the 
    // check should throw if not satisfied, or if we seek to collect all errors 
    // and only throw at the end. Here, set to false - only throw at end
    proofUtils.checkNumNotes(proofData, numNotes, false, errors);

    // convertToBNAndAppendPoints appends gamma and sigma to the end of proofdata as well
    const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData, errors);

    const formattedChallenge = (new BN(challenge.slice(2), 16)).toRed(groupReduction);

    // convert to bn.js instances if not already
    if (BN.isBN(za)) {
        zaBN = za;
    } else {
        zaBN = new BN(za);
    }

    if (BN.isBN(zb)) {
        zbBN = zb;
    } else {
        zbBN = new BN(zb);
    }

    // Check that za and zb are less than k_max
    if (zaBN.gte(K_MAXBN)) {
        errors.push(errorTypes.ZA_TOO_BIG);
    }

    if (zbBN.gte(K_MAXBN)) {
        errors.push(errorTypes.ZB_TOO_BIG);
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
    finalHash.appendBN(zaBN);
    finalHash.appendBN(zbBN);
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    let x = new BN(0).toRed(groupReduction);
    x = rollingHash.keccak(groupReduction);

    proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        if (i === 0) { // input note
            const kBarX = kBar.redMul(x); // xbk = bk*x
            const aBarX = aBar.redMul(x); // xba = ba*x
            const challengeX = formattedChallenge.mul(x);
            x = rollingHash.keccak(groupReduction);
            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul(challengeX).neg());
            kBarArray.push(kBar);
        }

        if (i === 1) { // output note
            const aBarX = aBar.redMul(x);
            const kBarX = kBar.redMul(x);
            const challengeX = formattedChallenge.mul(x);
            x = rollingHash.keccak(groupReduction);
            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul(challengeX).neg());
            kBarArray.push(kBar);
        }

        if (i === 2) { // residual note
            const zbRed = zbBN.toRed(groupReduction);
            const zaRed = zaBN.toRed(groupReduction);

            // kBar_3 = (z_b)(kBar_1) - (z_a)(kBar_2)
            kBar = (zbRed.redMul(kBarArray[0])).redSub(zaRed.redMul(kBarArray[1]));

            const aBarX = aBar.redMul(x);
            const kBarX = kBar.redMul(x);
            const challengeX = formattedChallenge.redMul(x);
            x = rollingHash.keccak(groupReduction);

            B = gamma.mul(kBarX).add(bn128.h.mul(aBarX)).add(sigma.mul((challengeX).neg()));
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
    if (finalChallenge !== challenge) {
        errors.push(errorTypes.CHALLENGE_RESPONSE_FAIL);
    }
    const valid = errors.length === 0;

    return {
        valid,
        errors,
    };
};

module.exports = verifier;
