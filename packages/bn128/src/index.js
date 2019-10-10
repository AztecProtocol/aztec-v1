/* eslint-disable new-cap */
/**
 * Wrapper around elliptic.js implementation of a Barreto-Naehrig curve over a 254 bit prime field
 * @module bn128
 */

const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const EC = require('elliptic');
const { randomHex, hexToNumberString, padLeft } = require('web3-utils');

const decodePoint = require('./decodePoint');

const bn128 = {};

/** modulus of bn128 curve's finite field (p)
 *  @type {BN}
 *  @default
 *  21888242871839275222246405745257275088696311157297823662689037894645226208583
 */
bn128.fieldModulus = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);

/** modulus of bn128's elliptic curve group (n)
 *  @type {BN}
 *  @default
 *  21888242871839275222246405745257275088548364400416034343698204186575808495617
 */
bn128.groupModulus = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10);

bn128.compressionMask = new BN('8000000000000000000000000000000000000000000000000000000000000000', 16);
bn128.groupReduction = BN.red(bn128.groupModulus);
bn128.zeroBnRed = new BN(0).toRed(bn128.groupReduction);

/**
 * The elliptic.js curve object
 */
bn128.curve = new EC.curve.short({
    a: '0',
    b: '3',
    p: bn128.fieldModulus.toString(16),
    n: bn128.groupModulus.toString(16),
    gRed: false,
    g: ['1', '2'],
});

const hXHex = '0x093a76a96633bd5f0a7177040b349486850d98f3a924986f219cc2366f21e4d1';
const hYHex = '0x13c6ccce9ac58d3a4b6899acdb17e52be9c88208fbb2fad9aeaf60ab14788e3a';

/**
 * X-Coordinate of AZTEC's second generator point 'h'. Created by taking the keccak256 hash of the ascii string
 *      'just read the instructions', right-padded to 32 bytes. i.e:
 *      0x6A75737420726561642074686520696E737472756374696F6E73000000000000. H_X is the result of this hash, modulo
 *      the elliptic curve group modulus n.
 *  @type {BN}
 *  @default
 */
bn128.H_X = new BN(hexToNumberString(hXHex), 10);

/** Y-Coordinate of AZTEC's second generator point 'h'. Created from odd-valued root of (H_X^{3} + 3)
 *  @type {BN}
 *  @default
 */
bn128.H_Y = new BN(hexToNumberString(hYHex), 10);

bn128.h = bn128.curve.point(bn128.H_X, bn128.H_Y);

/**
 * The common reference string
 */
bn128.t2 = [
    '0x293ac2bf4d234d8c820c91bbbbbe4aeeefeacd407153bd585d288a96372f3a72',
    '0x2ea4865f019129437c22977d4a460855a30f160d2ea3e224281d1eccd5ce4fa2',
    '0x29fb36fb858e8886286c7901e5ec956efa65c2b20bed2b5493ef5545da8edb98',
    '0x0523def7549176dbefc119c5cc975d4a92cd4bed8ce08ecd301fceecbd6efa7f',
];

bn128.CRS = [padLeft(`0x${bn128.H_X.toString(16)}`, 64), padLeft(`0x${bn128.H_Y.toString(16)}`, 64), ...bn128.t2];

/**
 * Compress a bn128 point into 256 bits.
 * @method compress
 * @param {BN} x x coordinate
 * @param {BN} y y coordinate
 * @returns {BN} 256-bit compressed coordinate, in BN form
 */
bn128.compress = (x, y) => {
    let compressed = x;
    if (y.testn(0)) {
        compressed = compressed.or(bn128.compressionMask);
    }
    return compressed;
};

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
bn128.decompress = (compressed) => {
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.curve.red);
    const y2 = x
        .redSqr()
        .redMul(x)
        .redIAdd(bn128.curve.b);
    const yRoot = y2.redSqrt();
    if (
        yRoot
            .redSqr()
            .redSub(y2)
            .fromRed()
            .cmpn(0) !== 0
    ) {
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
 * @method decompressHex
 * @param {string} compressed 256-bit compressed coordinate in string form
 * @returns {Point} coordinates of point, in elliptic.js Point form
 */
bn128.decompressHex = (compressedHex) => {
    const compressed = new BN(compressedHex, 16);
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.curve.red);
    const y2 = x
        .redSqr()
        .redMul(x)
        .redIAdd(bn128.curve.b);
    const yRoot = y2.redSqrt();
    if (
        yRoot
            .redSqr()
            .redSub(y2)
            .fromRed()
            .cmpn(0) !== 0
    ) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit)) {
        y = bn128.curve.p.sub(y);
    }
    return bn128.curve.point(x.fromRed(), y);
};

/**
 * Get a random BN in the bn128 curve group's reduction context
 * @method randomGroupScalar
 * @returns {BN} BN.js instance
 */
bn128.randomGroupScalar = () => {
    return new BN(randomHex(32), 16).toRed(bn128.groupReduction);
};

// TODO: replace with optimized C++ implementation, this is way too slow
/**
 * Brute-force recover an AZTEC note value from a decrypted point pair.
 *   Requires the value 'k' is less than ~ 1 million
 * @method recoverMessage
 * @param {Point} gamma the AZTEC note coordinate \gamma
 * @param {Point} gammaK the AZTEC decrypted coordinate \gamma^{k}. Computed from \sigma.h^{-a}
 * @returns {number} the value of the note
 */
bn128.recoverMessage = (gamma, gammaK) => {
    if (gammaK.isInfinity()) {
        return 1;
    }
    const a = decodePoint.serializePointForMcl(gamma);
    const b = decodePoint.serializePointForMcl(gammaK);
    return decodePoint.decode(a, b, constants.K_MAX);
};

/**
 * Get a random point on the curve
 * @method randomPoint
 * @returns {Point} a random point
 */
bn128.randomPoint = () => {
    const recurse = () => {
        const x = new BN(randomHex(32), 16).toRed(bn128.curve.red);
        const y2 = x
            .redSqr()
            .redMul(x)
            .redIAdd(bn128.curve.b);
        const y = y2.redSqrt();
        if (
            y
                .redSqr(y)
                .redSub(y2)
                .cmp(bn128.curve.a)
        ) {
            return recurse();
        }
        return bn128.curve.point(x, y);
    };
    return recurse();
};

module.exports = bn128;
