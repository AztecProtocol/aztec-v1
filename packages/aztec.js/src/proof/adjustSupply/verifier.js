/**
 * Verification algorithm for AZTEC adjustSupply zero-knowledge proofs
 *
 * @namespace verifier
 * @memberof module:proof.adjustSupply
 */
const utils = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const proofUtils = require('../proofUtils');

const { ERROR_TYPES } = utils.constants;

const { groupReduction } = bn128;

const verifier = {};

/**
 * Verify an AZTEC adjustSupply zero-knowledge proof
 *
 * @method verifyProof
 * @memberof module:proof.adjustSupply.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string} sender Ethereum address of transaction sender
 */
verifier.verifyProof = (proofData, challengeHex, sender) => {
    const m = 1;
    const errors = [];

    const {
        rollingHash,
        notes,
        challenge,
    } = proofUtils.convertTranscript(proofData, m, challengeHex, errors, 'adjustSupply');

    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    let x = new BN(0).toRed(groupReduction);

    let pairingGammas;
    let pairingSigmas;

    notes.forEach((note, i) => {
        let { kBar, aBar } = note;
        let c = challenge;

        if (i >= m) {
            x = rollingHash.keccak(groupReduction);
            kBar = kBar.redMul(x);
            aBar = aBar.redMul(x);
            c = challenge.redMul(x);
        }

        const sigma = note.sigma.mul(c).neg();
        const B = note.gamma.mul(kBar)
            .add(bn128.h.mul(aBar))
            .add(sigma);
        if (i === m) {
            pairingGammas = note.gamma;
            pairingSigmas = sigma.neg();
        } else if (i > m) {
            pairingGammas = pairingGammas.add(note.gamma.mul(c));
            pairingSigmas = pairingSigmas.add(sigma);
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
    });
    const challengeResponse = finalHash.keccak(groupReduction);
    const finalChallenge = `0x${padLeft(challengeResponse.toString(16), 64)}`;

    if (finalChallenge !== challengeHex) {
        errors.push(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
    }
    const valid = errors.length === 0;
    return {
        valid,
        errors,
        pairingGammas,
        pairingSigmas,
    };
};

module.exports = verifier;
