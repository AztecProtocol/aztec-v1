const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const { constants, errors } = require('@aztec/dev-utils');

const Keccak = require('../keccak');
const bn128 = require('../bn128');
const proofUtils = require('./proofUtils');

const { groupReduction } = bn128;

const verifier = {};

/**
 * Verify AZTEC private range proof transcript
 *
 * @method verifyProof
 * @memberof module:privateRange
 * @param {Object[]} proofData - proofData array of AZTEC notes
 * @param {string} challengeHex - challenge variable used in zero-knowledge protocol
 * @param {string} sender - Ethereum address
 * @returns {boolean} valid - boolean that describes whether the proof verification is valid
 * @returns {option} errors - an array of all errors that were caught
 */
verifier.verifyProof = (proofData, challengeHex, sender) => {
    const errors = [];
    const kBarArray = [];
    const numNotes = 3;
    const kPublicBN = new BN(0);
    const publicOwner = constants.addresses.ZERO_ADDRESS;

    // Used to check the number of notes. Boolean argument specifies whether the
    // check should throw if not satisfied, or if we seek to collect all errors
    // and only throw at the end. Here, set to false - only throw at end
    // proofUtils.checkNumNotes(proofData, numNotes, false, errors);

    // convertToBNAndAppendPoints appends gamma and sigma to the end of proofdata as well
    const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData, errors);
    let challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    // console.log('used challenge: ', challenge.toString());

    const rollingHash = new Keccak();

    proofDataBn.forEach((proofElement) => {
        rollingHash.appendPoint(proofElement[6]);
        rollingHash.appendPoint(proofElement[7]);
    });

    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(kPublicBN);
    finalHash.appendBN(new BN(publicOwner.slice(2), 16));
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    let x;

    proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];
        let B;

        if (i === 0) {
            B = gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma.mul(challenge).neg());
            kBarArray.push(kBar);
            console.log('i: ', i, 'B.x: ', B.x.toString());

        } else if (i === 1) {
            x = rollingHash.keccak(constants.BN128_GROUP_REDUCTION);

            const kBarX = kBar.redMul(x); // xbk = bk*x
            const aBarX = aBar.redMul(x); // xba = ba*x
            challenge = challenge.redMul(x);
            x = rollingHash.keccak(constants.BN128_GROUP_REDUCTION);
            B = gamma
                .mul(kBarX)
                .add(bn128.h.mul(aBarX))
                .add(sigma.mul(challenge).neg());

            console.log('i: ', i, 'B.x: ', B.x.toString());

            kBarArray.push(kBar);
        } else {
            // kBar_3 = kBar_1 - kBar_2
            kBar = kBarArray[0].redSub(kBarArray[1]);
            const kBarX = kBar.redMul(x);
            const aBarX = aBar.redMul(x);
            challenge = challenge.redMul(x);
            x = rollingHash.keccak(constants.BN128_GROUP_REDUCTION);

            B = gamma
                .mul(kBarX)
                .add(bn128.h.mul(aBarX))
                .add(sigma.mul(challenge.neg()));
            console.log('i: ', i, 'B.x: ', B.x.fromRed().toString((16), 64));
            console.log('i: ', i, 'B.y: ', B.y.fromRed().toString((16), 64));
            kBarArray.push(kBar);
        }

        if (B === null) {
            errors.push(constants.errorTypes.BLINDING_FACTOR_IS_NULL);
        } else if (B.isInfinity()) {
            errors.push(constants.errorTypes.BAD_BLINDING_FACTOR);
            finalHash.appendBN(new BN(0));
            finalHash.appendBN(new BN(0));
        } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
            errors.push(constants.errorTypes.BAD_BLINDING_FACTOR);
            finalHash.appendPoint(B);
        } else {
            finalHash.appendPoint(B);
        }

        return {
            kBar,
            B,
        };
    });

    // console.log('challenge response hash: ', finalHash);

    const challengeResponse = `0x${padLeft(finalHash.keccak(constants.BN128_GROUP_REDUCTION).toString(16), 64)}`;
    console.log('recovered challenge: ', finalHash.keccak(constants.BN128_GROUP_REDUCTION).fromRed().toString());
    console.log('original challenge: ', challenge.toString());

    // Check if the recovered challenge, matches the original challenge. If so, proof construction is validated
    if (challengeResponse !== challengeHex) {
        errors.push(errors.CHALLENGE_RESPONSE_FAIL);
    }

    // console.log('recovered challenge: ', challengeResponse);
    const valid = errors.length === 0;

    return {
        valid,
        errors,
    };
};

module.exports = verifier;
