/**
 * Verification algorithm for AZTEC join-split zero-knowledge proofs
 *
 * @module verifier
 */
const BN = require('bn.js');

const bn128 = require('../bn128/bn128');
const Keccak = require('../keccak/keccak');

const { groupReduction } = bn128;
const zero = new BN(0).toRed(groupReduction);

const verifier = {};

function hexToGroupScalar(hex, errors, canBeZero = false) {
    const hexBn = new BN(hex.slice(2), 16);
    if (!hexBn.lt(bn128.n)) {
        errors.push(verifier.ERRORS.SCALAR_TOO_BIG);
    }
    if (!canBeZero && hexBn.eq(new BN(0))) {
        errors.push(verifier.ERRORS.SCALAR_ZERO);
    }
    return hexBn.toRed(groupReduction);
}

function hexToGroupElement(xHex, yHex, errors) {
    let x = new BN(xHex.slice(2), 16);
    let y = new BN(yHex.slice(2), 16);
    if (!x.lt(bn128.p)) {
        errors.push(verifier.ERRORS.X_TOO_BIG);
    }
    if (!y.lt(bn128.p)) {
        errors.push(verifier.ERRORS.Y_TOO_BIG);
    }
    x = x.toRed(bn128.red);
    y = y.toRed(bn128.red);
    const lhs = y.redSqr();
    const rhs = x.redSqr().redMul(x).redAdd(bn128.b);
    if (!lhs.fromRed().eq(rhs.fromRed())) {
        errors.push(verifier.ERRORS.NOT_ON_CURVE);
    }
    return bn128.point(x, y);
}

/**
 * @enum {ERRORS}
 * @description enum to track verification errors. We want to accumulate all errors instead of throwing at the first
 */
verifier.ERRORS = {
    SCALAR_TOO_BIG: 'group scalar is not modulo the bn128 group order!',
    SCALAR_ZERO: 'group scalar cannot equal zero!',
    X_TOO_BIG: 'group element x coordinate is not modulo the bn128 field order!',
    Y_TOO_BIG: 'group element y coordinate is not modulo the bn128 field order!',
    NOT_ON_CURVE: 'group element is not on bn128 curve!',
    BAD_BLINDING_FACTOR: 'blinding factor is at infinity or is zero!',
    CHALLENGE_RESPONSE_FAIL: 'challenge does not match challenge response',
};

/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {Number} m number of input notes
 * @param {String} challengeHex hex-string formatted proof challenge
 * @param {String[]} errors container for discovered errors
 */
verifier.convertTranscript = (proofData, m, challengeHex, errors) => {
    const challenge = hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    const kPublic = hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
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
                errors.push(verifier.ERRORS.SCALAR_ZERO);
            }
        } else {
            kBar = hexToGroupScalar(note[0], errors);
            if (i >= m) {
                runningKBar = runningKBar.redSub(kBar);
            } else {
                runningKBar = runningKBar.redAdd(kBar);
            }
        }
        const result = {
            kBar,
            aBar: hexToGroupScalar(note[1], errors),
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
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {Number} m number of input notes
 * @param {String} challengeHex hex-string formatted proof challenge
 * @param {String} sender Ethereum address of transaction sender
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

    rollingHash.keccak();
    let x;

    let pairingGammas;
    let pairingSigmas;
    notes.forEach((note, i) => {
        let { kBar, aBar } = note;
        let c = challenge;
        if (i >= m) {
            x = rollingHash.toGroupScalar(groupReduction);
            kBar = kBar.redMul(x);
            aBar = aBar.redMul(x);
            c = challenge.redMul(x);
            rollingHash.keccak();
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
            errors.push(verifier.ERRORS.BAD_BLINDING_FACTOR);
            finalHash.appendBN(new BN(0));
            finalHash.appendBN(new BN(0));
        } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
            errors.push(verifier.ERRORS.BAD_BLINDING_FACTOR);
            finalHash.append(B);
        } else {
            finalHash.append(B);
        }
    });
    finalHash.keccak();
    const challengeResponse = finalHash.toGroupScalar(groupReduction);
    if (!challengeResponse.fromRed().eq(challenge.fromRed())) {
        errors.push(verifier.ERRORS.CHALLENGE_RESPONSE_FAIL);
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
