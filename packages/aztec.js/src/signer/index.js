/**
 * Module to ECDSA signatures over structured data,
 *   following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @module signer
 */

const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const { randomHex, padRight } = require('web3-utils');

const signer = {};

/**
 * Generate EIP712 domain parameters for ACE.sol
 * @method generateACEDomainParams
 * @param {string} verifyingContract address of target contract
 * @returns {Object} EIP712 Domain type object
 */
signer.generateACEDomainParams = (verifyingContract, domain = constants.eip712.ACE_DOMAIN_PARAMS) => {
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
signer.generateZKAssetDomainParams = (verifyingContract) => {
    return {
        ...constants.eip712.ZK_ASSET_DOMAIN_PARAMS,
        verifyingContract,
    };
};

/**
 * Create an EIP712 ECDSA signature over an AZTEC note, suited for the confidentialApprove() method of a 
 * ZkAsset. The ZkAsset.confidentialApprove() method must be called when granting note spending permission
 * to a third party and is required in order for ZkAsset.confidentialTransferFrom() to be successful.
 *
 * This is expected to be the most commonly used note signing() function. However for use cases, such as
 * testing, where ACE domain params are required then the signNoteACEDomain() function is
 * available.
 * @method signNoteForConfidentialApprove
 * @param {string} verifyingContract address of target contract
 * @param {string} noteHash noteHash of the note being signed
 * @param {string} spender address of the note spender
 * @param {string} privateKey the private key of message signer
 * @returns {string} ECDSA signature parameters [r, s, v], formatted as 32-byte wide hex-strings
 */
signer.signNoteForConfidentialApprove = (verifyingContract, noteHash, spender, privateKey) => {
    const domain = signer.generateZKAssetDomainParams(verifyingContract);
    const schema = constants.eip712.NOTE_SIGNATURE;
    const status = true;
    const message = {
        noteHash,
        spender,
        status,
    };
    const { signature } = signer.signTypedData(domain, schema, message, privateKey);
    const r = signature[1];
    const s = signature[2].slice(2);
    const v = signature[0].slice(-2);
    return r + s + v;
};

/**
 * Create an EIP712 ECDSA signature over an AZTEC note, to be used to give permission for
 * note expenditure during a zkAsset confidentialTransfer() method call
 *
 * @method signNoteForConfidentialTransfer
 * @param {string} verifyingContract address of target contract
 * @param {string} noteOwnerAccount Ethereum account (privateKey, publicKey and address) of owner of the note
 * being signed
 * @param {string} noteHash hash of the note being signed
 * @param {string} challenge hexadecimal representation of the challenge variable
 * @param {string} sender address of the transaction sender
 * @returns {string} ECDSA signature parameters [r, s, v] 
 */
signer.signNotesForConfidentialTransfer = (verifyingContract, noteOwnerAccount, noteHash, challenge, sender) => {
    const domain = signer.generateZKAssetDomainParams(verifyingContract);
    const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
    const message = {
        proof: proofs.JOIN_SPLIT_PROOF,
        noteHash,
        challenge,
        sender,
    };

    const { privateKey } = noteOwnerAccount;
    const { signature } = signer.signTypedData(domain, schema, message, privateKey);

    const r = signature[1].slice(2);
    const s = signature[2].slice(2);
    const v = padRight(signature[0].slice(-2), 64);

    return r + s + v;
};

/**
 * Create an EIP712 ECDSA signature over an AZTEC note, for an ACE.sol domain
 * @method signNoteACEDomain
 * @param {string} verifyingContract address of target contract
 * @param {string} spender address of the note spender
 * @param {string} privateKey the private key of message signer
 * @returns {string[]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */

signer.signNoteACEDomain = (verifyingContract, spender, privateKey) => {
    const domain = signer.generateACEDomainParams(verifyingContract, constants.eip712.ACE_DOMAIN_PARAMS);
    const schema = constants.eip712.NOTE_SIGNATURE;
    const status = true;

    const message = {
        noteHash: randomHex(32),
        spender,
        status,
    };
    return signer.signTypedData(domain, schema, message, privateKey);
};

/**
 * Create an EIP712 ECDSA signature over structured data
 * @method signTypedData
 * @param {string} schema JSON object that defines the structured data of the signature
 * @param {string[]} domain variables required for the domain hash part of the signature
 * @param {string} message the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @param {string} privateKey the private key of message signer
 * @returns {string[]} ECDSA signature parameters [v, r, s], formatted as 32-byte wide hex-strings
 */
signer.signTypedData = (domain, schema, message, privateKey) => {
    const encodedTypedData = typedData.encodeTypedData({
        domain,
        ...schema,
        message,
    });
    const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);
    return {
        signature,
        encodedTypedData,
    };
};

module.exports = signer;
