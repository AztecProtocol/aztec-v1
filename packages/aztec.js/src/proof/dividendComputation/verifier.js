const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const helpers = require('./helpers');
const { K_MAX } = require('../../params');


const { groupReduction } = bn128;
const { customError } = utils.errors;
const { ERROR_TYPES } = utils.constants;

const verifier = {};


/**
 * Verify AZTEC dividend computation proof transcript
 *
 * @method verifyProof
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {BN} challenge - challenge variable used in zero-knowledge protocol
 * @returns {number} - returns 1 if proof is validated, throws an error if not
 */
verifier.verifyProof = (proofData, challenge, sender, za, zb) => {
    let zaBN;
    let zbBN;
    const K_MAXBN = new BN(K_MAX);
    const kBarArray = [];

    // toBnAndAppendPoints appends gamma and sigma to the end of proofdata as well
    const proofDataBn = helpers.toBnAndAppendPoints(proofData);

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
        throw customError(
            ERROR_TYPES.ZA_TOO_BIG,
            {
                data: `za is greater than the maximum allowed value of K_MAX - ${K_MAX}`,
            }
        );
    }

    if (zbBN.gte(K_MAXBN)) {
        throw customError(
            ERROR_TYPES.ZB_TOO_BIG,
            {
                data: `zb is greater than the maximum allowed value of K_MAX - ${K_MAX}`,
            }
        );
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
            throw customError(
                ERROR_TYPES.BLINDING_FACTOR_IS_NULL,
                {
                    data: 'Blinding factor is equal to null',
                }
            );
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
        throw customError(
            ERROR_TYPES.PROOF_FAILED,
            {
                data: `The recovered challenge does not equal the original challenge.
                           Proof validation has failed`,
            }
        );
    } else {
        return true;
    }
};

module.exports = verifier;
