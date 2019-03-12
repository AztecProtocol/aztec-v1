/**
 * Verification algorithm for AZTEC mint zero-knowledge proofs
 *
 * @namespace verifier
 * @memberof module:proof.mint
 */
const BN = require('bn.js');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const proofUtils = require('../proofUtils');

const { groupReduction } = bn128;
const zero = new BN(0).toRed(groupReduction);

const verifier = {};


/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @memberof module:proof.mint.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string[]} errors container for discovered errors
 */
verifier.convertTranscript = (proofData, challengeHex, errors) => {
    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    const kPublic = proofUtils.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
    let runningKBar = zero.redSub(kPublic).redMul(challenge);
    const rollingHash = new Keccak();

    const notes = proofData.map((note, i) => {
        let kBar;
        const m = 1;
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
            gamma: proofUtils.hexToGroupElement(note[2], note[3], errors),
            sigma: proofUtils.hexToGroupElement(note[4], note[5], errors),
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
 * @memberof module:proof.mint.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string} sender Ethereum address of transaction sender
 */
verifier.verifyProof = (proofData, challengeHex, sender) => {
    const errors = [];
    const {
        rollingHash,
        kPublic,
        notes,
        challenge,
    } = verifier.convertTranscript(proofData, challengeHex, errors);

    const finalHash = new Keccak();
    finalHash.appendBN(new BN(sender.slice(2), 16));
    finalHash.appendBN(kPublic.fromRed());
    finalHash.data = [...finalHash.data, ...rollingHash.data];

    let x;

    let pairingGammas;
    let pairingSigmas;
    notes.forEach((note, i) => {
        console.log('i: ', i);
        let { kBar, aBar } = note;
        let c = challenge;
        const m = 1;
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
    const challengeResponse = finalHash.keccak(groupReduction);
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
