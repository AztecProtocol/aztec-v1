/**
 * Wrapper around elliptic.js implemenation of the secp256k1 curve
 *
 * @module secp256k1
 */

const BN = require('bn.js');
const crypto = require('crypto');
const elliptic = require('elliptic');
const web3Utils = require('web3-utils');

/**
 * @typedef {Object} Account
 * @property {string} privateKey hex-formatted private key
 * @property {string} publicKey hex-formatted public key (uncompressed)
 * @property {string} address ethereum address of account
 */

const secp256k1 = {};

/**
 * The elliptic.js ec object
 * @memberof module:secp256k1
 */
secp256k1.ec = new elliptic.ec("secp256k1"); // eslint-disable-line

secp256k1.curve = secp256k1.ec.curve;
/**
 * Derive an ethereum account from a private key
 * @method accountFromPrivateKey
 * @memberof module:secp256k1
 * @param privateKey hex-formatted private key
 * @return {module:secp256k1~Account} an ethereum account
 */
secp256k1.accountFromPrivateKey = function accountFromPrivateKey(privateKey) {
    const ecKey = secp256k1.ec.keyFromPrivate(privateKey.slice(2), 'hex');
    const publicKey = `0x${ecKey.getPublic(false, 'hex').slice(2)}`; // remove elliptic.js encoding byte
    const publicHash = web3Utils.sha3(publicKey);
    const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    return {
        privateKey,
        publicKey: `0x${ecKey.getPublic(false, 'hex')}`,
        address,
    };
};

/**
 * Generate a random ethereum account
 * @method generateAccount
 * @memberof module:secp256k1
 * @return {module:secp256k1~Account} an ethereum account
 */
secp256k1.generateAccount = function generateAccount() {
    return secp256k1.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
};

/**
 * Get a random point on the curve
 * @method randomPoint
 * @memberof module:secp256k1
 * @returns {Point} a random point
 */
secp256k1.randomPoint = function randomPoint() {
    function recurse() {
        const x = new BN(crypto.randomBytes(32), 16).toRed(secp256k1.ec.curve.red);
        const y2 = x.redSqr().redMul(x).redIAdd(secp256k1.ec.curve.b);
        const y = y2.redSqrt();
        if (y.redSqr(y).redSub(y2).cmp(secp256k1.ec.curve.a)) {
            return recurse();
        }
        return secp256k1.ec.curve.point(x, y);
    }
    return recurse();
};


/**
 * Decompress a 256-bit representation of a secp256k1 G1 element.
 *   The first variable defines the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 *
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
secp256k1.decompress = (compressed, yBit) => {
    const x = compressed.maskn(255).toRed(secp256k1.curve.red);
    const y2 = x.redSqr().redMul(x).redIAdd(secp256k1.curve.b);
    const yRoot = y2.redSqrt();
    if (yRoot.redSqr().redSub(y2).fromRed().cmpn(0) !== 0) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit.eq(new BN(1)))) {
        y = secp256k1.curve.p.sub(y);
    }
    return { x: x.fromRed(), y };
};


/**
 * Decompress a 256-bit representation of a secp256k1 G1 element.
 *   The first variable defines the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 *
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
secp256k1.decompressHex = (compressed) => {
    if (compressed.length !== 66) {
        throw new Error(`expected compressed secp256k1 element ${compressed} to have length 66`);
    }
    const x = new BN(compressed.slice(0, 64), 16).toRed(secp256k1.curve.red);
    const yBit = new BN(compressed.slice(64, 66), 16);
    const y2 = x.redSqr().redMul(x).redIAdd(secp256k1.curve.b);
    const yRoot = y2.redSqrt();
    if (yRoot.redSqr().redSub(y2).fromRed().cmpn(0) !== 0) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit.eq(new BN(1)))) {
        y = secp256k1.curve.p.sub(y);
    }
    return secp256k1.curve.point(x.fromRed(), y);
};


/**
 * Compress a secp256k1 point into 33 bytes.
 *
 * @method compress
 * @param {Point} point secp256k1 group element
 * @returns {string} hex-formatted compressed point
 */
secp256k1.compress = (point) => {
    const compressed = web3Utils.padLeft(point.x.fromRed().toString(16), 64);
    if (point.y.fromRed().testn(0)) {
        return `0x${compressed}01`;
    }
    return `0x${compressed}00`;
};

module.exports = secp256k1;
