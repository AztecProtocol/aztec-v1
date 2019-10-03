/* eslint-disable new-cap */
/**
 * Wrapper around elliptic.js implementation of a Barreto-Naehrig curve over a 254 bit prime field
 * @module bn128
 */

const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const EC = require('elliptic');
const { randomHex } = require('web3-utils');

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

/**
 * X-Coordinate of AZTEC's second generator point 'h'. Created by taking the keccak256 hash of the ascii string
 *      'just read the instructions', right-padded to 32 bytes. i.e:
 *      0x6A75737420726561642074686520696E737472756374696F6E73000000000000. H_X is the result of this hash, modulo
 *      the elliptic curve group modulus n.
 *  @type {BN}
 *  @default
 *  7673901602397024137095011250362199966051872585513276903826533215767972925880
 */
// bn128.H_X = new BN('29510877138996177b6377685d7ad13049824250b4c84b59292b542ec1bd1a2c', 16);

// /** Y-Coordinate of AZTEC's second generator point 'h'. Created from odd-valued root of (H_X^{3} + 3)
//  *  @type {BN}
//  *  @default
//  *  8489654445897228341090914135473290831551238522473825886865492707826370766375
//  */
// bn128.H_Y = new BN('245d8aa2a80d7979919b6fafc50e5b954ae6d11625bb93691dfdd110fa0db78d', 16);

bn128.h = bn128.curve.point(bn128.H_X, bn128.H_Y);

/**
 * The common reference string
 */
bn128.t2 = [
    '0xc332790575a124b4e0719ea8b8de7dd3f05c4cd17bc33bec7e6eef4118dd8df',
    '0x24cd5e5e3ecb3c5ff762f2019ff27b21964e98e12f859d2e5d86e1a0582dc9be',
    '0x8baa9ddaa219f46c462de4b3577ba514d3989d1eb06f34fcc0c0d4b62d4c4d5',
    '0x2419a805e1384577d9081b465a793e6a18d8335923b1bae4884c8ca80b28fea',
];
bn128.CRS = [
    `0x2883d3b3bc1069ebc6de30d112fbcf338ca221a054e82b80a380d7d3bb571d9f`,
    `0x249ea3a110a7700146e43fd8274ec1e40a1071ae1aa043b2fdbd91221a2091e6`,
    ...bn128.t2,
];

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
