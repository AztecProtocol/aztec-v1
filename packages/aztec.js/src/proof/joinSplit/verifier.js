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
const zero = new BN(0).toRed(groupReduction);
const { ERROR_TYPES } = utils.constants;


const verifier = {};

function hexToGroupElement(xHex, yHex, errors) {
    let x = new BN(xHex.slice(2), 16);
    let y = new BN(yHex.slice(2), 16);
    if (!x.lt(bn128.curve.p)) {
        errors.push(ERROR_TYPES.X_TOO_BIG);
    }
    if (!y.lt(bn128.curve.p)) {
        errors.push(ERROR_TYPES.Y_TOO_BIG);
    }
    x = x.toRed(bn128.curve.red);
    y = y.toRed(bn128.curve.red);
    const lhs = y.redSqr();
    const rhs = x.redSqr().redMul(x).redAdd(bn128.curve.b);
    if (!lhs.fromRed().eq(rhs.fromRed())) {
        errors.push(ERROR_TYPES.NOT_ON_CURVE);
    }
    return bn128.curve.point(x, y);
}

/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @memberof module:proof.joinSplit.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string[]} errors container for discovered errors
 */
verifier.convertTranscript = (proofData, m, challengeHex, errors) => {
    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    const kPublic = proofUtils.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
    let runningKBar = zero.redSub(kPublic).redMul(challenge);
    const rollingHash = new Keccak();

    const notes = proofData.map((note, i) => {
        let kBar;
        if (i === n - 1) {
            if (n === m) {
                kBar = zero.redSub(runningKBar);
            } else {
                kBar = runningKBar;
            }
            if (kBar.fromRed().eq(new BN(0))) {
                errors.push(ERROR_TYPES.SCALAR_IS_ZERO);
            }
        } else {
            kBar = proofUtils.hexToGroupScalar(note[0], errors);
            if (i >= m) {
                runningKBar = runningKBar.redSub(kBar);
            } else {
                runningKBar = runningKBar.redAdd(kBar);
            }
        }
        const result = {
            kBar,
            aBar: proofUtils.hexToGroupScalar(note[1], errors),
            gamma: hexToGroupElement(note[2], note[3], errors),
            sigma: hexToGroupElement(note[4], note[5], errors),
        };
        rollingHash.append(result.gamma);
        rollingHash.append(result.sigma);
        return result;
    });
    return {
        notes,
        rollingHash,
        challenge,
        kPublic,
    };
};

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
    } = verifier.convertTranscript(proofData, m, challengeHex, errors);

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
    if (!challengeResponse.fromRed().eq(challenge.fromRed())) {
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
