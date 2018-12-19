/**
 * Module to ECDSA signatures over structured data,
 *   following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @module sign
 */

const ecdsa = require('../secp256k1/ecdsa');
const eip712 = require('./eip712');
const { AZTEC_NOTE_SIGNATURE, AZTEC_MAINNET_DOMAIN_PARAMS } = require('../params');

const sign = {};

/**
 * generate EIP712 domain parameters for AZTECERC20Bridge.sol
 * @method generateAZTECDomainParams
 * @param {string} verifyingContract address of target contract
 * @param {number} chainId the network ID
 * @returns {Object} EIP712 Domain type object
 */
sign.generateAZTECDomainParams = function generateAZTECDomainParams(verifyingContract, chainId) {
    return {
        name: 'AZTECERC20BRIDGE_DOMAIN',
        version: '0.1.1',
        chainId,
        verifyingContract,
    };
};

/**
 * create an EIP712 ECDSA signature over an AZTEC note
 * @method signNote
 * @param {string[]} note bytes32 array of AZTEC zero-knowledge proof note (indices 0 and 1 are not needed here)
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not neccesarily the note signer)
 * @param {string} verifyingContract address of target contract
 * @param {string} privateKey the private key of message signer
 * @param {number} chainId the network ID
 * @returns {string[]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */
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
    return signature;
};

/**
 * recover the Ethereum address of an EIP712 AZTEC note signature
 * @method recoverAddress
 * @param {string[]} note bytes32 array of AZTEC zero-knowledge proof note (indices 0 and 1 are not needed here)
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not neccesarily the note signer)
 * @param {string} verifyingContract address of target contract
 * @param {string[]} signature ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 * @returns {string} Ethereum address of signer
 */
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
