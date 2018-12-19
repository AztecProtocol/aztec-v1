/**
 * Wrapper around elliptic.js implemenation of the secp256k1 curve
 *
 * @module Secp256k1
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


function Secp256k1() {
    /**
     * The elliptic.js ec object
     * @memberof module:secp256k1
     */
    const ec = new elliptic.ec("secp256k1"); // eslint-disable-line

    /**
     * Derive an ethereum account from a private key
     * @method accountFromPrivateKey
     * @memberof module:secp256k1
     * @param privateKey hex-formatted private key
     * @return {module:secp256k1~Account} an ethereum account
     */
    ec.accountFromPrivateKey = function accountFromPrivateKey(privateKey) {
        const ecKey = ec.keyFromPrivate(privateKey.slice(2), 'hex');
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
    ec.generateAccount = function generateAccount() {
        return ec.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
    };

    /**
     * Get a random point on the curve
     * @method randomPoint
     * @memberof module:secp256k1
     * @returns {Point} a random point
     */
    ec.randomPoint = function randomPoint() {
        function recurse() {
            const x = new BN(crypto.randomBytes(32), 16).toRed(ec.curve.red);
            const y2 = x.redSqr().redMul(x).redIAdd(ec.curve.b);
            const y = y2.redSqrt();
            if (y.redSqr(y).redSub(y2).cmp(ec.curve.a)) {
                return recurse();
            }
            return ec.curve.point(x, y);
        }
        return recurse();
    };

    return ec;
}

module.exports = Secp256k1();
