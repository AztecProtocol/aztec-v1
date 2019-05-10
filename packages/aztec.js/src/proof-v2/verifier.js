const { errors } = require('@aztec/dev-utils');
const BN = require('bn.js');

const bn128 = require('../bn128');
const Keccak = require('../keccak');
const { ProofType } = require('./proof');

const { groupReduction } = bn128;
const ZERO_BN = new BN(0).toRed(groupReduction);

/**
 * Class used to verify AZTEC zero-knowledge proofs
 */
class Verifier {
    /**
     * @param {Proof} proof the Proof object to be verified
     */
    constructor(proof) {
        if (!proof) {
            throw new Error('proof cannot be undefined');
        }
        if (!proof.type || !ProofType[proof.type]) {
            throw new Error(`proof type should be one of ${ProofType.enumValues}`);
        }
        this.proof = proof;
        this.errors = [];

        this.convertTranscript();
    }

    get isValid() {
        return this.errors.length === 0;
    }

    /**
     * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
     */
    convertTranscript() {
        this.challenge = this.hexToGroupScalar(this.proof.challengeHex);
        const n = this.proof.data.length;

        if (this.proof.type === ProofType.JOIN_SPLIT.name) {
            this.publicValue = this.hexToGroupScalar(this.proof.data[n - 1][0], true);
        } else {
            this.publicValue = new BN(0).toRed(groupReduction);
        }

        if (this.proof.type === ProofType.BURN.name || this.proof.type === ProofType.MINT.name) {
            const numNotes = this.proof.data.length;
            if (numNotes < 2) {
                this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
            }
        }

        let runningKBar = ZERO_BN.redSub(this.publicValue.redMul(this.challenge));
        this.rollingHash = new Keccak();
        this.notes = this.proof.data.map((note, i) => {
            let kBar;
            if (i === n - 1) {
                if (n === this.proof.m) {
                    kBar = ZERO_BN.redSub(runningKBar);
                } else {
                    kBar = runningKBar;
                }
                if (kBar.fromRed().eq(new BN(0))) {
                    this.errors.push(errors.codes.SCALAR_IS_ZERO);
                }
            } else {
                kBar = this.hexToGroupScalar(note[0]);
                if (i >= this.proof.m) {
                    runningKBar = runningKBar.redSub(kBar);
                } else {
                    runningKBar = runningKBar.redAdd(kBar);
                }
            }
            const result = {
                kBar,
                aBar: this.hexToGroupScalar(note[1]),
                gamma: this.hexToGroupElement(note[2], note[3]),
                sigma: this.hexToGroupElement(note[4], note[5]),
            };
            this.rollingHash.append(result.gamma);
            this.rollingHash.append(result.sigma);
            return result;
        });
    }

    /**
     * Converts a hexadecimal input to a group element

     * @param {string} xHex hexadecimal representation of x coordinate
     * @param {string} yHex hexadecimal representation of y coordinate
     * @returns {BN} bn.js formatted version of a point on the bn128 curve
     */
    hexToGroupElement(xHex, yHex) {
        let x = new BN(xHex.slice(2), 16);
        let y = new BN(yHex.slice(2), 16);
        if (!x.lt(bn128.curve.p)) {
            this.errors.push(errors.codes.X_TOO_BIG);
        }
        if (!y.lt(bn128.curve.p)) {
            this.errors.push(errors.codes.Y_TOO_BIG);
        }
        x = x.toRed(bn128.curve.red);
        y = y.toRed(bn128.curve.red);
        const lhs = y.redSqr();
        const rhs = x
            .redSqr()
            .redMul(x)
            .redAdd(bn128.curve.b);
        if (!lhs.fromRed().eq(rhs.fromRed())) {
            this.errors.push(errors.codes.NOT_ON_CURVE);
        }
        return bn128.curve.point(x, y);
    }

    /**
     * Convert a hexadecimal input into a scalar bn.js
     *
     * @param {string} hex hex input
     * @param {boolean} canbeZero control to determine hex input can be zero
     * @returns {BN} bn.js formatted version of the scalar
     */
    hexToGroupScalar(hex, canBeZero = false) {
        const hexBn = new BN(hex.slice(2), 16);
        if (!hexBn.lt(bn128.curve.n)) {
            this.errors.push(errors.codes.SCALAR_TOO_BIG);
        }
        if (!canBeZero && hexBn.eq(new BN(0))) {
            this.errors.push(errors.codes.SCALAR_IS_ZERO);
        }
        return hexBn.toRed(groupReduction);
    }
}

module.exports = Verifier;
