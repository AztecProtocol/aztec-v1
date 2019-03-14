/**
 * Module to ECDSA signatures over structured data,  
 *   following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @namespace sign
 * @memberof module:sign
 */

const {
    constants: {
        AZTEC_NOTE_SIGNATURE,
    },
} = require('@aztec/dev-utils');
const eip712 = require('./eip712');
const secp256k1 = require('../secp256k1');

// For backwards compatibility. TODO: remove
const defaultDomainParams = {
    name: 'AZTEC_CRYPTOGRAPHY_ENGINE',
    version: '1',
};

const sign = {};
sign.eip712 = eip712;

/**
 * generate EIP712 domain parameters for AZTECERC20Bridge.sol
 * @method generateAZTECDomainParams
 * @memberof module:sign
 * @param {string} verifyingContract address of target contract
 * @returns {Object} EIP712 Domain type object
 */
sign.generateAZTECDomainParams = function generateAZTECDomainParams(
    verifyingContract,
    domainParams = defaultDomainParams
) {
    return {
        name: domainParams.name,
        version: domainParams.version,
        verifyingContract,
    };
};

/**
 * create an EIP712 ECDSA signature over structured data
 * @method signStructuredData
 * @memberof module:sign
 * @param {string[]} domainParams variables required for the domain hash part of the signature
 * @param {string} schema JSON object that defines the structured data of the signature
 * @param {string} message the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string} privateKey the private key of message signer
 * @returns {string[]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */
sign.signStructuredData = function signStructuredData(domainParams, schema, message, privateKey) {
    const typedData = {
        ...schema,
        domain: domainParams,
        message,
    };
    const encodedTypedData = eip712.encodeTypedData(typedData);
    const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);
    return { signature, encodedTypedData };
};

/**
 * create an EIP712 ECDSA signature over structured data
 * @method signStructuredData
 * @memberof module:sign
 * @param {string} schema JSON object that defines the structured data of the signature
 * @param {string[]} domain variables required for the domain hash part of the signature
 * @param {string} message the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string} privateKey the private key of message signer
 * @returns {string[]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */
sign.signStructuredData = function signStructuredData(domain, schema, message, privateKey) {
    const typedData = {
        domain,
        ...schema,
        message,
    };
    const hashStruct = eip712.encodeTypedData(typedData);
    const signature = secp256k1.ecdsa.signMessage(hashStruct, privateKey);
    return { hashStruct, signature };
};

/**
 * recover the Ethereum address of an EIP712 AZTEC note signature
 * @method recoverAddress
 * @memberof module:sign
 * @param {string[]} note bytes32 array of AZTEC zero-knowledge proof note (indices 0 and 1 are not needed here)
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string} verifyingContract address of target contract
 * @param {string[]} signature ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 * @returns {string} Ethereum address of signer
 */
sign.recoverAddress = function recoverAddress(note, challenge, senderAddress, verifyingContract, signature) {
    const messageBase = {
        ...AZTEC_NOTE_SIGNATURE,
        domain: sign.generateAZTECDomainParams(verifyingContract),
        message: {
            note: [note[2], note[3], note[4], note[5]],
            challenge,
            sender: senderAddress,
        },
    };
    const message = eip712.encodeTypedData(messageBase);
    const publicKey = secp256k1.ecdsa.recoverPublicKey(message, signature[1], signature[2], signature[0]);
    const address = secp256k1.ecdsa.accountFromPublicKey(publicKey);
    return address;
};

module.exports = sign;
