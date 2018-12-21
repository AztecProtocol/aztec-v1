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

module.exports = secp256k1;
