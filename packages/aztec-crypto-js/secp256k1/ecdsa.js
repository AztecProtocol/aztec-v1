const BN = require('bn.js');
const web3Utils = require('web3-utils');
const Web3EthAccounts = require('web3-eth-accounts');

const secp256k1 = require('./secp256k1');

const web3EthAccounts = new Web3EthAccounts();

const ecdsa = {};

ecdsa.keyPairFromPrivate = function keyPairFromPrivate(privateKey) {
    const buffer = Buffer.from(privateKey.slice(2), 'hex');
    const ecKey = secp256k1.keyFromPrivate(buffer);
    const publicKey = `0x${ecKey.getPublic(false, 'hex').slice(2)}`;
    const publicHash = web3Utils.sha3(publicKey);
    const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    return {
        privateKey,
        publicKey: ecKey.getPublic(),
        address,
    };
};

ecdsa.accountFromPublicKey = function accountFromPublicKey(publicKey) {
    const ecKey = secp256k1.keyFromPublic(publicKey);
    const publicKeyHex = `0x${ecKey.getPublic(false, 'hex').slice(2)}`;
    const publicHash = web3Utils.sha3(publicKeyHex);
    const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    return address;
};

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

ecdsa.verifyMessage = (hash, r, s, publicKey) => {
    const rBn = new BN(r.slice(2), 16);
    const sBn = new BN(s.slice(2), 16);
    return secp256k1.verify(hash.slice(2), { r: rBn, s: sBn }, secp256k1.keyFromPublic(publicKey.slice(2), 'hex'));
};

ecdsa.recoverPublicKey = (hash, r, s, vn) => {
    const rBn = new BN(r.slice(2), 16);
    const sBn = new BN(s.slice(2), 16);
    const v = new BN(vn.slice(2), 16).toNumber();
    const ecPublicKey = secp256k1.recoverPubKey(
        Buffer.from(web3Utils.padLeft(hash.slice(2), 64), 'hex'),
        { r: rBn, s: sBn },
        v < 2 ? v : 1 - (v % 2)
    );
    return ecPublicKey;
};

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
