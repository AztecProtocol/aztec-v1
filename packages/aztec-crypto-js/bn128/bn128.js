/* eslint-disable new-cap */
/**
 * Wrapper around elliptic.js implemenation of a Barreto-Naehrig curve over a 254 bit prime field
 *
 * @module bn128
 */

const BN = require('bn.js');
const EC = require('elliptic');
const crypto = require('crypto');

const {
    FIELD_MODULUS,
    GROUP_MODULUS,
    H_X,
    H_Y,
    K_MAX,
} = require('../params');

function Bn128() {
    /**
     * The elliptic.js curve object
     * @memberof module:bn128
     */
    const curve = new EC.curve.short({
        a: '0',
        b: '3',
        p: FIELD_MODULUS.toString(16),
        n: GROUP_MODULUS.toString(16),
        gRed: false,
        g: ['1', '2'],
    });

    /**
     * BN.js reduction context for bn128 curve group's prime modulus
     * @memberof module:bn128
     */
    curve.groupReduction = BN.red(curve.n);

    /**
     * Get a random BN in the bn128 curve group's reduction context
     * @method randomGroupScalar
     * @memberof module:bn128
     * @returns {BN} BN.js instance
     */
    curve.randomGroupScalar = () => {
        return new BN(crypto.randomBytes(32), 16).toRed(curve.groupReduction);
    };

    /**
     * Get a random point on the curve
     * @method randomPoint
     * @memberof module:bn128
     * @returns {Point} a random point
     */
    curve.randomPoint = function randomPoint() {
        function recurse() {
            const x = new BN(crypto.randomBytes(32), 16).toRed(curve.red);
            const y2 = x.redSqr().redMul(x).redIAdd(curve.b);
            const y = y2.redSqrt();
            if (y.redSqr(y).redSub(y2).cmp(curve.a)) {
                return recurse();
            }
            return curve.point(x, y);
        }
        return recurse();
    };

    /**
     * Map a hash to a point on the curve
     * @method getFromHash
     * @memberof module:bn128
     * @param {BN} x the hash as a BN.js instance
     * @returns {Object} x, y coordinates of point
     */
    curve.getFromHash = function getFromHash(x) {
        const y2 = x.redSqr().redMul(x).redIAdd(curve.b);
        const y = y2.redSqrt();
        if (!y.redSqr().eq(y2)) {
            throw new Error('point is not on curve');
        }
        return { x, y };
    };

    /**
     * elliptic.js Point representation of AZTEC generator point
     * @memberof module:bn128
     */
    curve.h = curve.point(H_X, H_Y);

    // TODO: replace with optimized C++ implementation, this is way too slow
    /**
     * Brute-force recover an AZTEC note value from a decrypted point pair.
     *   Requires the value 'k' is less than ~ 1 million
     * @method recoverMessage
     * @memberof module:bn128
     * @param {Point} gamma the AZTEC note coordinate \gamma
     * @param {Point} gammaK the AZTEC decrypted coordinate \gamma^{k}. Computed from \sigma.h^{-a}
     * @returns {Number} the value of the note
     */
    curve.recoverMessage = function recoverMessage(gamma, gammaK) {
        if (gammaK.isInfinity()) {
            return 1;
        }
        let accumulator = gamma;
        let k = 1;
        while (k < K_MAX) {
            if (accumulator.eq(gammaK)) {
                break;
            }
            accumulator = accumulator.add(gamma);
            k += 1;
        }
        if (k === K_MAX) {
            throw new Error('could not find k!');
        }
        return k;
    };

    return curve;
}

module.exports = Bn128();
