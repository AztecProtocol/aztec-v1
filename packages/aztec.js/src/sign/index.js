/**
 * Module to ECDSA signatures over structured data,
 *   following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @module sign
 */

const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const eip712 = require('./eip712');

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
    domain = constants.eip712.ACE_DOMAIN_PARAMS,
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
sign.generateZKAssetDomainParams = function generateZKAssetDomainParams(verifyingContract) {
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

module.exports = sign;
