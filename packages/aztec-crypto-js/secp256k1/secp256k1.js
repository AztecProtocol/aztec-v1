const crypto = require('crypto');
const elliptic = require('elliptic');
const web3Utils = require('web3-utils');

function Secp256k1() {
    const curve = new elliptic.ec("secp256k1"); // eslint-disable-line

    curve.accountFromPrivateKey = function accountFromPrivateKey(privateKey) {
        const ecKey = curve.keyFromPrivate(privateKey.slice(2), 'hex');
        const publicKey = `0x${ecKey.getPublic(false, 'hex').slice(2)}`; // remove elliptic.js encoding byte
        const publicHash = web3Utils.sha3(publicKey);
        const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
        return {
            privateKey,
            publicKey: `0x${ecKey.getPublic(false, 'hex')}`,
            address,
        };
    };

    curve.generateAccount = function generateAccount() {
        return curve.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
    };

    return curve;
}

module.exports = Secp256k1();
