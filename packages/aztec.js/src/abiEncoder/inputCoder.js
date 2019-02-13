
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

    const abiSettings = {
        CHALLENGE: {
            inputIndex: 1,
            encodedIndex: 0,
        },

        PROOF_DATA: {
            inputIndex: 0,
            encodedIndex: 1,
        },

        INPUT_OWNERS: {
            inputIndex: 2,
            encodedIndex: 2,
        },
        OUTPUT_OWNERS: {
            inputIndex: 3,
            encodedIndex: 3,
        },
        METADATA: {
            inputIndex: 4,
            encodedIndex: 4,
        },
    };

    const result = encoderFactory.encode(configs, abiSettings, 'bilateralSwap');
    return result;
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

    const abiSettings = {
        M: {
            inputIndex: 1,
            encodedIndex: 0,
        },

        CHALLENGE: {
            inputIndex: 2,
            encodedIndex: 1,
        },

        PUBLIC_OWNER: {
            inputIndex: 3,
            encodedIndex: 2,
        },

        PROOF_DATA: {
            inputIndex: 0,
            encodedIndex: 3,
        },

        INPUT_SIGNATURES: {
            inputIndex: 4,
            encodedIndex: 4,
        },

        OUTPUT_OWNERS: {
            inputIndex: 5,
            encodedIndex: 5,
        },

        METADATA: {
            inputIndex: 6,
            encodedIndex: 6,
        },
    };

    const result = encoderFactory.encode(configs, abiSettings, 'joinSplit');
    return result;
};

module.exports = inputCoder;
