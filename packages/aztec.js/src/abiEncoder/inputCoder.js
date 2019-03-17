
const { padLeft } = require('web3-utils');

const encoderFactory = require('./encoderFactory');

const inputCoder = {};


inputCoder.bilateralSwap = (proofData, challenge, inputOwners, outputOwners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = [
        'PROOF_DATA',
        'INPUT_OWNERS',
        'OUTPUT_OWNERS',
        'METADATA',
    ];

    return encoderFactory.encode(configs, abiParams, 'bilateralSwap');
};

inputCoder.joinSplit = (proofData, m, challenge, publicOwner, inputSignatures, outputOwners, metadata) => {
    const configs = {
        M: padLeft(Number(m).toString(16), 64),
        CHALLENGE: challenge.slice(2),
        PUBLIC_OWNER: padLeft(publicOwner.slice(2), 64),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_SIGNATURES: encoderFactory.encodeInputSignatures(inputSignatures),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = [
        'PROOF_DATA',
        'INPUT_SIGNATURES',
        'OUTPUT_OWNERS',
        'METADATA',
    ];

    return encoderFactory.encode(configs, abiParams, 'joinSplit');
};

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

    const abiParams = [
        'PROOF_DATA',
        'INPUT_OWNERS',
        'OUTPUT_OWNERS',
        'METADATA',
    ];

    return encoderFactory.encode(configs, abiParams, 'dividendComputation');
};

inputCoder.adjustSupply = (proofData, challenge, inputOwners, outputOwners, metadata) => {
    const configs = {
        CHALLENGE: challenge.slice(2),
        PROOF_DATA: encoderFactory.encodeProofData(proofData),
        INPUT_OWNERS: encoderFactory.encodeInputOwners(inputOwners),
        OUTPUT_OWNERS: encoderFactory.encodeOutputOwners(outputOwners),
        METADATA: encoderFactory.encodeMetadata(metadata),
    };

    const abiParams = [
        'PROOF_DATA',
        'INPUT_OWNERS',
        'OUTPUT_OWNERS',
        'METADATA',
    ];

    return encoderFactory.encode(configs, abiParams, 'adjustSupply');
};

module.exports = inputCoder;
