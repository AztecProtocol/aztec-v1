/**
 * Create and validate ECDSA signatures, uses elliptic.js library
 *
 * @module ecdsa
 */

const BN = require('bn.js');
const web3Utils = require('web3-utils');
const Web3EthAccounts = require('web3-eth-accounts');

const secp256k1 = require('./secp256k1');

const web3EthAccounts = new Web3EthAccounts();

const ecdsa = {};

/**
 * Convert an Ethereum public key into an address
 *
 * @method accountFromPublicKey
 * @param {String} publicKey hex-string formatted public key (uncompressed)
 * @returns {String} address
 */
ecdsa.accountFromPublicKey = (publicKey) => {
    const ecKey = secp256k1.keyFromPublic(publicKey);
    const publicKeyHex = `0x${ecKey.getPublic(false, 'hex').slice(2)}`;
    const publicHash = web3Utils.sha3(publicKeyHex);
    const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    return address;
};

/**
 * Sign a message hash with a given private key
 *
 * @method signMessage
 * @param {String} hash hex-string formatted message hash
 * @param {String} privateKey hex-string formatted private key
 * @returns {String[3]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */
ecdsa.signMessage = (hash, privateKey) => {
    const signature = secp256k1
        .keyFromPrivate(Buffer.from(privateKey.slice(2), 'hex'))
        .sign(Buffer.from(hash.slice(2), 'hex'), { canonical: true });
    return [
        `0x${web3Utils.padLeft(Number(27 + Number(signature.recoveryParam)).toString(16), 64)}`,
        `0x${web3Utils.padLeft(signature.r.toString(16), 64)}`,
        `0x${web3Utils.padLeft(signature.s.toString(16), 64)}`,
    ];
};


/**
 * Verify an ECDSA signature against a publickey
 *
 * @method verifyMessage
 * @param {String} hash hex-string formatted message hash
 * @param {String} r hex-string formatted ECDSA parameter r
 * @param {String} s hex-string formatted ECDSA parameter s
 * @param {String} publicKey hex-string formatted public key (uncompressed)
 * @returns {bool} true if signature signed by publicKey, false otherwise
 */
ecdsa.verifyMessage = (hash, r, s, publicKey) => {
    const rBn = new BN(r.slice(2), 16);
    const sBn = new BN(s.slice(2), 16);
    return secp256k1.verify(hash.slice(2), { r: rBn, s: sBn }, secp256k1.keyFromPublic(publicKey.slice(2), 'hex'));
};

/**
 * Recover the signing key of an ECDSA signature
 *
 * @method recoverPublicKey
 * @param {String} hash hex-string formatted message hash
 * @param {String} r hex-string formatted ECDSA parameter r
 * @param {String} s hex-string formatted ECDSA parameter s
 * @param {String} vn hex-string ECDSA parameter v
 * @returns {Object} elliptic.js public key object of message signer
 */
ecdsa.recoverPublicKey = (hash, r, s, v) => {
    const rBn = new BN(r.slice(2), 16);
    const sBn = new BN(s.slice(2), 16);
    const vn = new BN(v.slice(2), 16).toNumber();
    const ecPublicKey = secp256k1.recoverPubKey(
        Buffer.from(web3Utils.padLeft(hash.slice(2), 64), 'hex'),
        { r: rBn, s: sBn },
        vn < 2 ? vn : 1 - (vn % 2)
    );
    return ecPublicKey;
};

/**
 * Compares signatures from this module with those signed by web3. For debug and test purposes
 * (we don't use web3 because we want a different preamble for eip712 signatures)
 *
 * @method web3Comparison
 * @returns {Object} ecdsa module signature and web3 signature
 */
ecdsa.web3Comparison = () => {
    const account = web3EthAccounts.create();
    const { privateKey } = account;
    const initialMessage = account.address;
    const web3Sig = account.sign(account.address, '');
    const initialBuffer = Buffer.from(web3Utils.hexToBytes(initialMessage, 'hex'));
    const preamble = Buffer.from(`\x19Ethereum Signed Message:\n${initialBuffer.length}`);
    const messageBuffer = Buffer.concat([preamble, initialBuffer]);
    const hashedMessage = web3Utils.sha3(messageBuffer);

    const result = ecdsa.signMessage(hashedMessage, privateKey);

    return ({ result, web3Sig });
};

module.exports = ecdsa;
