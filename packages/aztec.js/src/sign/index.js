/**
 * Module to ECDSA signatures over structured data,  
 *   following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @module sign
 */

const { constants, proofs } = require('@aztec/dev-utils');
const eip712 = require('./eip712');
const secp256k1 = require('../secp256k1');

const sign = {};
sign.eip712 = eip712;

/**
 * Generate EIP712 domain parameters for ACE.sol
 * @method generateAZTECDomainParams
 * @param {string} verifyingContract address of target contract
 * @returns {Object} EIP712 Domain type object
 */
sign.generateAZTECDomainParams = function generateAZTECDomainParams(
    verifyingContract,
    domain = constants.eip712.ACE_DOMAIN_PARAMS
) {
    return {
        name: domain.name,
        version: domain.version,
        verifyingContract,
    };
};

/**
 * Generate EIP712 domain parameters for ZkAsset.sol
 * @method generateZKAssetDomainParams
 * @param {string} verifyingContract address of target contract
 * @returns {Object} EIP712 Domain type object
 */
sign.generateZKAssetDomainParams = function generateZKAssetDomainParams(
    verifyingContract
) {
    return {
        ...constants.eip712.ZK_ASSET_DOMAIN_PARAMS,
        verifyingContract,
    };
};

/**
 * Create an EIP712 ECDSA signature over structured data
 * @method signStructuredData
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
    const encodedTypedData = eip712.encodeTypedData(typedData);
    const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);
    return { signature, encodedTypedData };
};

/**
 * Recover the Ethereum address of an EIP712 AZTEC note signature
 * @method recoverAddress
 * @param {string[]} note bytes32 array of AZTEC zero-knowledge proof note (indices 0 and 1 are not needed here)
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string} verifyingContract address of target contract
 * @param {string[]} signature ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 * @returns {string} Ethereum address of signer
 */
sign.recoverAddress = function recoverAddress(note, challenge, senderAddress, verifyingContract, signature) {
    const messageBase = {
        ...constants.eip712.JOIN_SPLIT_SIGNATURE,
        domain: sign.generateAZTECDomainParams(verifyingContract),
        message: {
            proof: proofs.JOIN_SPLIT_PROOF,
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
