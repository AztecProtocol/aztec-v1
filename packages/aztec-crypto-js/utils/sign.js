const ecdsa = require('../secp256k1/ecdsa');
const eip712 = require('./eip712');
const { AZTEC_NOTE_SIGNATURE, AZTEC_MAINNET_DOMAIN_PARAMS } = require('../params');

const sign = {};

sign.generateAZTECDomainParams = function generateAZTECDomainParams(verifyingContract, chainId) {
    return {
        name: 'AZTECERC20BRIDGE_DOMAIN',
        version: '0.1.1',
        chainId,
        verifyingContract,
    };
};

sign.signNote = function signNote(note, challenge, senderAddress, verifyingContract, privateKey, chainId) {
    const messageBase = {
        ...AZTEC_NOTE_SIGNATURE,
        domain: sign.generateAZTECDomainParams(verifyingContract, chainId),
        message: {
            note: [note[2], note[3], note[4], note[5]],
            challenge,
            sender: senderAddress,
        },
    };
    const message = eip712.encodeTypedData(messageBase);
    const signature = ecdsa.signMessage(message, privateKey);
    return { message, signature };
};

sign.recoverAddress = function recoverAddress(note, challenge, senderAddress, verifyingContract, signature) {
    const messageBase = {
        ...AZTEC_NOTE_SIGNATURE,
        domain: {
            ...AZTEC_MAINNET_DOMAIN_PARAMS,
            verifyingContract,
        },
        message: {
            note: [note[2], note[3], note[4], note[5]],
            challenge,
            sender: senderAddress,
        },
    };
    const message = eip712.encodeTypedData(messageBase);
    const publicKey = ecdsa.recoverPublicKey(message, signature[1], signature[2], signature[0]);
    const address = ecdsa.accountFromPublicKey(publicKey);
    return address;
};

module.exports = sign;
