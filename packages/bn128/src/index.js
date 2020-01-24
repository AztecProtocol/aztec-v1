/* eslint-disable new-cap */
/**
 * Wrapper around elliptic.js implementation of a Barreto-Naehrig curve over a 254 bit prime field
 * @module bn128
 */

import { constants } from '@aztec/dev-utils';
import BN from 'bn.js';
import EC from 'elliptic';
import { randomHex, hexToNumberString, padLeft } from 'web3-utils';

import { serializePointForMcl, decode } from './decodePoint';

/** modulus of bn128 curve's finite field (p)
 *  @type {BN}
 *  @default
 *  21888242871839275222246405745257275088696311157297823662689037894645226208583
 */
export const fieldModulus = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);

/** modulus of bn128's elliptic curve group (n)
 *  @type {BN}
 *  @default
 *  21888242871839275222246405745257275088548364400416034343698204186575808495617
 */
export const groupModulus = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10);

export const compressionMask = new BN('8000000000000000000000000000000000000000000000000000000000000000', 16);
export const groupReduction = BN.red(groupModulus);
export const zeroBnRed = new BN(0).toRed(groupReduction);

/**
 * The elliptic.js curve object
 */
export const curve = new EC.curve.short({
    a: '0',
    b: '3',
    p: fieldModulus.toString(16),
    n: groupModulus.toString(16),
    gRed: false,
    g: ['1', '2'],
});

const hXHex = '0x00164b60d0fa1eab5d56d9653aed9dc7f7473acbe61df67134c705638441c4b9';
const hYHex = '0x2bb1b9b55ffdcf2d7254dfb9be2cb4e908611b4adeb4b838f0442fce79416cf0';

/**
 * X-Coordinate of AZTEC's second generator point 'h'. Created by taking the keccak256 hash of the ascii string
 *      'just read the instructions', right-padded to 32 bytes. i.e:
 *      0x6A75737420726561642074686520696E737472756374696F6E73000000000000. H_X is the result of this hash, modulo
 *      the elliptic curve group modulus n.
 *  @type {BN}
 *  @default
 *  7673901602397024137095011250362199966051872585513276903826533215767972925880
 */
export const H_X = new BN(hexToNumberString(hXHex), 10);

/** Y-Coordinate of AZTEC's second generator point 'h'. Created from odd-valued root of (H_X^{3} + 3)
 *  @type {BN}
 *  @default
 *  8489654445897228341090914135473290831551238522473825886865492707826370766375
 */
export const H_Y = new BN(hexToNumberString(hYHex), 10);

export const h = curve.point(H_X, H_Y);

/**
 * The common reference string
 */
export const t2 = [
    '0x0118c4d5b837bcc2bc89b5b398b5974e9f5944073b32078b7e231fec938883b0',
    '0x260e01b251f6f1c7e7ff4e580791dee8ea51d87a358e038b4efe30fac09383c1',
    '0x22febda3c0c0632a56475b4214e5615e11e6dd3f96e6cea2854a87d4dacc5e55',
    '0x04fc6369f7110fe3d25156c1bb9a72859cf2a04641f99ba4ee413c80da6a5fe4',
];

export const CRS = [padLeft(`0x${H_X.toString(16)}`, 64), padLeft(`0x${H_Y.toString(16)}`, 64), ...t2];

/**
 * Compress a bn128 point into 256 bits.
 * @method compress
 * @param {BN} x x coordinate
 * @param {BN} y y coordinate
 * @returns {BN} 256-bit compressed coordinate, in BN form
 */
export function compress(x, y) {
    let compressed = x;
    if (y.testn(0)) {
        compressed = compressed.or(compressionMask);
    }
    return compressed;
}

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
export function decompress(compressed) {
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(curve.red);
    const y2 = x
        .redSqr()
        .redMul(x)
        .redIAdd(curve.b);
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
        y = curve.p.sub(y);
    }
    return { x: x.fromRed(), y };
}

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 * @method decompressHex
 * @param {string} compressed 256-bit compressed coordinate in string form
 * @returns {Point} coordinates of point, in elliptic.js Point form
 */
export function decompressHex(compressedHex) {
    const compressed = new BN(compressedHex, 16);
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(curve.red);
    const y2 = x
        .redSqr()
        .redMul(x)
        .redIAdd(curve.b);
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
        y = curve.p.sub(y);
    }
    return curve.point(x.fromRed(), y);
}

/**
 * Get a random BN in the bn128 curve group's reduction context
 * @method randomGroupScalar
 * @returns {BN} BN.js instance
 */
export function randomGroupScalar() {
    return new BN(randomHex(32), 16).toRed(groupReduction);
}

// TODO: replace with optimized C++ implementation, this is way too slow
/**
 * Brute-force recover an AZTEC note value from a decrypted point pair.
 *   Requires the value 'k' is less than ~ 1 million
 * @method recoverMessage
 * @param {Point} gamma the AZTEC note coordinate \gamma
 * @param {Point} gammaK the AZTEC decrypted coordinate \gamma^{k}. Computed from \sigma.h^{-a}
 * @returns {number} the value of the note
 */
export function recoverMessage(gamma, gammaK) {
    if (gammaK.isInfinity()) {
        return 1;
    }
    const a = serializePointForMcl(gamma);
    const b = serializePointForMcl(gammaK);
    return decode(a, b, constants.K_MAX);
}

/**
 * Get a random point on the curve
 * @method randomPoint
 * @returns {Point} a random point
 */
export function randomPoint() {
    const recurse = () => {
        const x = new BN(randomHex(32), 16).toRed(curve.red);
        const y2 = x
            .redSqr()
            .redMul(x)
            .redIAdd(curve.b);
        const y = y2.redSqrt();
        if (
            y
                .redSqr(y)
                .redSub(y2)
                .cmp(curve.a)
        ) {
            return recurse();
        }
        return curve.point(x, y);
    };
    return recurse();
}
