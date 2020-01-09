import * as bn128 from '@aztec/bn128';
import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import ProofType from '../types';

const { ZERO_BN } = constants;

/**
 * @class
 * @classdesc Class to verify AZTEC zero-knowledge proofs
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

        this.challenge = this.hexToGroupScalar(this.proof.challengeHex);
        if (this.proof.type === ProofType.JOIN_SPLIT.name) {
            this.publicValue = this.hexToGroupScalar(this.proof.data[this.proof.data.length - 1][0], true);
        } else {
            this.publicValue = bn128.zeroBnRed;
        }
        this.extractData();
    }

    get isValid() {
        return this.errors.length === 0;
    }

    /**
     * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
     */
    extractData() {
        this.data = this.proof.data.map((item) => {
            return {
                kBar: this.hexToGroupScalar(item[0]),
                aBar: this.hexToGroupScalar(item[1]),
                gamma: this.hexToGroupPoint(item[2], item[3]),
                sigma: this.hexToGroupPoint(item[4], item[5]),
            };
        });
    }

    /**
     * Converts a hexadecimal input to a group point

     * @param {string} xHex hexadecimal representation of x coordinate
     * @param {string} yHex hexadecimal representation of y coordinate
     * @returns {BN} bn.js formatted version of a point on the bn128 curve
     */
    hexToGroupPoint(xHex, yHex) {
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
        const hexBN = new BN(hex.slice(2), 16);
        if (!hexBN.lt(bn128.curve.n)) {
            this.errors.push(errors.codes.SCALAR_TOO_BIG);
        }
        if (!canBeZero && hexBN.eq(ZERO_BN)) {
            this.errors.push(errors.codes.SCALAR_IS_ZERO);
        }
        return hexBN.toRed(bn128.groupReduction);
    }
}

export default Verifier;
