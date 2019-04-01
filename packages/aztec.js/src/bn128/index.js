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
    constants: {
        FIELD_MODULUS,
        GROUP_MODULUS,
        H_X,
        H_Y,
        K_MAX,
    },
} = require('@aztec/dev-utils');
const decodePoint = require('./decodePoint');

const compressionMask = new BN('8000000000000000000000000000000000000000000000000000000000000000', 16);

const bn128 = {};

/**
 * The elliptic.js curve object
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
 */
bn128.groupReduction = BN.red(bn128.curve.n);

/**
 * Get a random BN in the bn128 curve group's reduction context
 * @method randomGroupScalar
 * @returns {BN} BN.js instance
 */
bn128.randomGroupScalar = () => {
    return new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
};

/**
 * Get a random point on the curve
 * @method randomPoint
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
 */
bn128.h = bn128.curve.point(H_X, H_Y);

bn128.K_MAX = K_MAX;

// TODO: replace with optimized C++ implementation, this is way too slow
/**
 * Brute-force recover an AZTEC note value from a decrypted point pair.  
 *   Requires the value 'k' is less than ~ 1 million
 * @method recoverMessage
 * @param {Point} gamma the AZTEC note coordinate \gamma
 * @param {Point} gammaK the AZTEC decrypted coordinate \gamma^{k}. Computed from \sigma.h^{-a}
 * @returns {number} the value of the note
 */
bn128.recoverMessage = function recoverMessage(gamma, gammaK) {
    if (gammaK.isInfinity()) {
        return 1;
    }
    const a = decodePoint.serializePointForMcl(gamma);
    const b = decodePoint.serializePointForMcl(gammaK);
    return decodePoint.decode(a, b, bn128.K_MAX);
};

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 *
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
bn128.decompress = (compressed) => {
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.curve.red);
    const y2 = x.redSqr().redMul(x).redIAdd(bn128.curve.b);
    const yRoot = y2.redSqrt();
    if (yRoot.redSqr().redSub(y2).fromRed().cmpn(0) !== 0) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit)) {
        y = bn128.curve.p.sub(y);
    }
    return { x: x.fromRed(), y };
};

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 *
 * @method decompressHex
 * @param {string} compressed 256-bit compressed coordinate in string form
 * @returns {Point} coordinates of point, in elliptic.js Point form
 */
bn128.decompressHex = (compressedHex) => {
    const compressed = new BN(compressedHex, 16);
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.curve.red);
    const y2 = x.redSqr().redMul(x).redIAdd(bn128.curve.b);
    const yRoot = y2.redSqrt();
    if (yRoot.redSqr().redSub(y2).fromRed().cmpn(0) !== 0) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit)) {
        y = bn128.curve.p.sub(y);
    }
    return bn128.curve.point(x.fromRed(), y);
};

/**
 * Compress a bn128 point into 256 bits.
 *
 * @method compress
 * @param {BN} x x coordinate
 * @param {BN} y y coordinate
 * @returns {BN} 256-bit compressed coordinate, in BN form
 */
bn128.compress = (x, y) => {
    let compressed = x;
    if (y.testn(0)) {
        compressed = compressed.or(compressionMask);
    }
    return compressed;
};
module.exports = bn128;
