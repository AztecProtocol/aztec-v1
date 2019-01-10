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

const bn128 = {};

/**
 * The elliptic.js curve object
 * @memberof module:bn128
 */
bn128.curve = new EC.curve.short({
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
bn128.groupReduction = BN.red(bn128.curve.n);

/**
 * Get a random BN in the bn128 curve group's reduction context
 * @method randomGroupScalar
 * @memberof module:bn128
 * @returns {BN} BN.js instance
 */
bn128.randomGroupScalar = () => {
    return new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
};

/**
 * Get a random point on the curve
 * @method randomPoint
 * @memberof module:bn128
 * @returns {Point} a random point
 */
bn128.randomPoint = function randomPoint() {
    function recurse() {
        const x = new BN(crypto.randomBytes(32), 16).toRed(bn128.curve.red);
        const y2 = x.redSqr().redMul(x).redIAdd(bn128.curve.b);
        const y = y2.redSqrt();
        if (y.redSqr(y).redSub(y2).cmp(bn128.curve.a)) {
            return recurse();
        }
        return bn128.curve.point(x, y);
    }
    return recurse();
};

/**
 * elliptic.js Point representation of AZTEC generator point
 * @memberof module:bn128
 */
bn128.h = bn128.curve.point(H_X, H_Y);

bn128.K_MAX = K_MAX;

// TODO: replace with optimized C++ implementation, this is way too slow
/**
 * Brute-force recover an AZTEC note value from a decrypted point pair.  
 *   Requires the value 'k' is less than ~ 1 million
 * @method recoverMessage
 * @memberof module:bn128
 * @param {Point} gamma the AZTEC note coordinate \gamma
 * @param {Point} gammaK the AZTEC decrypted coordinate \gamma^{k}. Computed from \sigma.h^{-a}
 * @returns {number} the value of the note
 */
bn128.recoverMessage = function recoverMessage(gamma, gammaK) {
    if (gammaK.isInfinity()) {
        return 1;
    }
    let accumulator = gamma;
    let k = 1;
    while (k < bn128.K_MAX) {
        if (accumulator.eq(gammaK)) {
            break;
        }
        accumulator = accumulator.add(gamma);
        k += 1;
    }
    if (k === bn128.K_MAX) {
        throw new Error('could not find k!');
    }
    return k;
};

module.exports = bn128;
