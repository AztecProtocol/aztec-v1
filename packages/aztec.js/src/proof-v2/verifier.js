const { errors } = require('@aztec/dev-utils');
const BN = require('bn.js');

const bn128 = require('../bn128');
const Keccak = require('../keccak');
const { ProofType } = require('./index');

const { AztecError, codes } = errors;

const ZERO_BN = new BN(0).toRed(bn128.groupReduction);

/**
 * Class used to verify AZTEC zero-knowledge proofs
 */
class Verifier {
    /**
     * @param {string} proofType one of the ProofType enum values
     */
    constructor(proofType) {
        if (!ProofType[proofType]) {
            throw new Error(`proof type should be one of ${ProofType.enumValues}`);
        }
        this.proofType = proofType;
    }

    /**
     * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
     * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
     * @param {number} m number of input notes
     * @param {string} challengeHex hex-string formatted proof challenge
     * @param {string[]} errors container for discovered errors
     * @returns {Object[]} notes - array of AZTEC notes
     * @returns {Hash} rolling hash - hash used to generate x in pairing optimisation
     * @returns {string} challenge - cryptographic challenge in
     * @returns {BN} kPublic - pubic value being converted in the transaction
     */
    convertTranscript(proofData, m, challengeHex) {
        if (this.proofType !== 'joinSplit' && this.proofType !== 'burn' && this.proofType !== 'mint') {
            throw new Error('Enter join-split, mint or burn in string format as the this.proofType variable');
        }

        const challenge = bn128.hexToGroupScalar(challengeHex, errors);
        const n = proofData.length;
        let kPublic;

        if (this.proofType === 'joinSplit') {
            kPublic = bn128.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
        } else {
            kPublic = new BN(0).toRed(bn128.groupReduction);
        }

        if (this.proofType === 'mint' || this.proofType === 'burn') {
            const numNotes = proofData.length;
            if (numNotes < 2) {
                throw new Error(codes.INCORRECT_NOTE_NUMBER);
            }
        }

        let runningKBar = ZERO_BN.redSub(kPublic).redMul(challenge);
        const rollingHash = new Keccak();

        const notes = proofData.map((testNote, i) => {
            let kBar;
            if (i === n - 1) {
                if (n === m) {
                    kBar = ZERO_BN.redSub(runningKBar);
                } else {
                    kBar = runningKBar;
                }
                if (kBar.fromRed().eq(new BN(0))) {
                    throw new AztecError(codes.SCALAR_IS_ZERO);
                }
            } else {
                kBar = bn128.hexToGroupScalar(testNote[0], errors);
                if (i >= m) {
                    runningKBar = runningKBar.redSub(kBar);
                } else {
                    runningKBar = runningKBar.redAdd(kBar);
                }
            }
            const result = {
                kBar,
                aBar: bn128.hexToGroupScalar(testNote[1], errors),
                gamma: bn128.hexToGroupElement(testNote[2], testNote[3], errors),
                sigma: bn128.hexToGroupElement(testNote[4], testNote[5], errors),
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
    }

    /**
     * Verify an AZTEC zero-knowledge proof
     * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
     * @param {number} m number of input notes
     * @param {string} challengeHex hex-string formatted proof challenge
     * @param {string} sender Ethereum address of transaction sender
     */
    verify(proofData, m, challengeHex, sender) {
        const a = this.b;
        const errors = [];
        const { rollingHash, kPublic, notes, challenge } = proofUtils.convertTranscript(
            proofData,
            m,
            challengeHex,
            errors,
            'joinSplit',
        );

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
                x = rollingHash.keccak(bn128.groupReduction);
                kBar = kBar.redMul(x);
                aBar = aBar.redMul(x);
                c = challenge.redMul(x);
            }
            const sigma = note.sigma.mul(c).neg();
            const B = note.gamma
                .mul(kBar)
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
    }
}

module.exports = { Verifier };
