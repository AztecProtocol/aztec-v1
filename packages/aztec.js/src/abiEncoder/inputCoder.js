/**
 * Input ABI encoder for the various proofs
 * @module inputCoder
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const { constants } = require('@aztec/dev-utils');
const encoderFactory = require('./encoderFactory');

const inputCoder = {};

/**
 * Input encoding for bilateral swap proof data
 *
 * @method bilateralSwap
 * @param {string[]} proofData - proofData generated by bilateral swap proof construction
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {string[]} owners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according
 * to the ABI spec of that particular proof
 */
inputCoder.bilateralSwap = (proofData, challenge, owners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(owners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'OUTPUT_OWNERS', 'METADATA'];

    return encoderFactory.encode(configs, abiParams, 'bilateralSwap');
};

/**
 * Input encoding for dividend computation proof data
 *
 * @method dividendComputation
 * @param {string[]} proofData - proofData generated by dividend computation proof construction
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {Number} za - nominator of the fraction representing the public ratio in a dividend proof
 * @param {Number} zb - denominator of the fraction representing the public ratio in a dividend proof
 * @param {string} inputOwners - owners of the input notes for a zero-knowledge proof
 * @param {string[]} outputOwners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according
 * to the ABI spec of that particular proof
 */
inputCoder.dividendComputation = (proofData, challenge, za, zb, inputOwners, outputOwners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        ZA: padLeft(Number(za).toString(16), 64),
        ZB: padLeft(Number(zb).toString(16), 64),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

    return encoderFactory.encode(configs, abiParams, 'dividendComputation');
};

/**
 * Input encoding for joinSplit proof data
 *
 * @method joinSplit
 * @param {string[]} proofData - proofData generated by joinSplit swap proof construction
 * @param {Number} m - number of input notes
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {string} publicOwner - owner of the public ERC20 tokens transferred in the proof
 * Input encoding for mint proof data
 * @param {string} inputOwners - owners of the input notes for a zero-knowledge proof
 * @param {string[]} outputOwners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 */
inputCoder.joinSplit = (proofData, m, challenge, publicOwner, inputOwners, outputOwners, metadata) => {
    const configs = {
        M: padLeft(Number(m).toString(16), 64),
        CHALLENGE: challenge.slice(2),
        PUBLIC_OWNER: padLeft(publicOwner.slice(2), 64),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

    return encoderFactory.encode(configs, abiParams, 'joinSplit');
};

/**
 * Input encoding for mint proof data
 *
 * @method mint
 * @param {string[]} proofData - proofData generated by mint proof construction
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {string} inputOwners - owners of the input notes for a zero-knowledge proof
 * @param {string[]} outputOwners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according
 * to the ABI spec of that particular proof
 */
inputCoder.mint = (proofData, challenge, inputOwners, outputOwners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

    return encoderFactory.encode(configs, abiParams, 'mint');
};

/**
 * Input encoding for burn proof data
 * 
 * @method burn
 * @param {string[]} proofData - proofData generated by burn proof construction
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {string} inputOwners - owners of the input notes for a zero-knowledge proof
 * @param {string[]} outputOwners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according
 * to the ABI spec of that particular proof
 */
inputCoder.burn = (proofData, challenge, inputOwners, outputOwners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];

    return encoderFactory.encode(configs, abiParams, 'burn');
};

/**
 * Input encoding for publicRange proof data
 *
 * @method publicRange
 * @param {string[]} proofData - proofData generated by publicRange proof construction
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @param {string} inputOwners - owners of the input notes for a zero-knowledge proof
 * @param {string[]} outputOwners - owners of the output notes from a zero-knowledge proof
 * @param {string[]} metadata - metadata attached to an AZTEC note
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according
 * to the ABI spec of that particular proof
 */
inputCoder.publicRange = (proofData, challenge, kPublic, inputOwners, outputOwners, metadata) => {
    let K_PUBLIC;

    if (kPublic < 0) {
        const kPublicBN = constants.GROUP_MODULUS.add(new BN(kPublic));
        K_PUBLIC = padLeft(kPublicBN.toString(16), 64);
    } else {
        K_PUBLIC = padLeft(Number(kPublic).toString(16), 64);
    }

    const configs = {
        CHALLENGE: challenge.slice(2),
        K_PUBLIC,
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = ['PROOF_DATA', 'INPUT_OWNERS', 'OUTPUT_OWNERS', 'METADATA'];
    return encoderFactory.encode(configs, abiParams, 'publicRange');
};

module.exports = inputCoder;
