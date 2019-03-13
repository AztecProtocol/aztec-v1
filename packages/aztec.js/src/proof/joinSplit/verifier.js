/**
 * Verification algorithm for AZTEC join-split zero-knowledge proofs
 *
 * @namespace verifier
 * @memberof module:proof.joinSplit
 */
const BN = require('bn.js');
const utils = require('@aztec/dev-utils');


const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const proofUtils = require('../proofUtils');

const { groupReduction } = bn128;
const { errorTypes } = utils.constants;

const verifier = {};

/**
 * Verify an AZTEC zero-knowledge proof
 *
 * @method verifyProof
 * @memberof module:proof.joinSplit.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string} sender Ethereum address of transaction sender
 */
verifier.verifyProof = (proofData, m, challengeHex, sender) => {
    const errors = [];
    const {
        rollingHash,
        kPublic,
        notes,
        challenge,
    } = proofUtils.convertTranscript(proofData, m, challengeHex, errors, 'joinSplit');

    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(kPublic.fromRed());
    finalHash.appendBN(new BN(m));
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    let x;

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
            pairingSigmas = note.sigma.neg();
        } else if (i > m) {
            pairingGammas = pairingGammas.add(note.gamma.mul(c));
            pairingSigmas = pairingSigmas.add(sigma);
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
    });
    const challengeResponse = finalHash.keccak(groupReduction);
    if (!challengeResponse.fromRed().eq(challenge.fromRed())) {
        errors.push(errorTypes.CHALLENGE_RESPONSE_FAIL);
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
