
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
            inputIndex: 0,
            encodedIndex: 0,
        },

        PROOF_DATA: {
            inputIndex: 1,
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

    const result = encoderFactory.encode(configs, abiSettings);
    return result;
};

module.exports = inputCoder;
