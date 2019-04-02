/**
 * ABI encoder factory for proof data
 * @module encoderFactory
 */

const { padLeft } = require('web3-utils');
const secp256k1 = require('../secp256k1');

const encoderFactory = {};


/**
 * Encode an AZTEC note into ABI compatible string array format
 *
 * @method encodeNote
 * @param {note[]} notes - array of AZTEC notes
 * @returns {string} notes - an array of AZTEC notes in a string array format
 */
encoderFactory.encodeNote = (notes) => {
    return notes.map(note => padLeft(note.slice(2), 64)).join('');
};


/**
 * Encode proofData into ABI compatible string array format
 *
 * @method encodeProofData
 * @param {Object[]} proofData - cryptographic proof data from proof construction
 * @returns {string} data - concatenated string array of proof data, with the first element being 
 * the length of the proofData
 * @returns {Number} length - length of the proofData, divided by 2 because hexadecimal 
 * characters each represent 0.5 bytes
 */
encoderFactory.encodeProofData = (proofData) => {
    const { length } = proofData;
    const noteString = proofData.map(notes => encoderFactory.encodeNote(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

/**
 * Encode inputOwners into ABI compatible string array format
 *
 * @method encodeInputOwners
 * @param {Object[]} inputOwners - Ethereum addresses of input note owners to a zero-knowledge proof
 * @returns {string} data - concatenated string array of inputOwner addresses, with the first element being 
 * the length of the inputOwners variable
 * @returns {Number} length - length of the inputOwnners string, divided by 2 because hexadecimal 
 * characters each represent 0.5 bytes
 */
encoderFactory.encodeInputOwners = (inputOwners) => {
    const { length } = inputOwners;
    const ownerStrings = inputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

/**
 * Encode encodeInputSignatures into ABI compatible string array format
 *
 * @method encodeInputSignatures
 * @param {Object[]} inputSignatures - ECDSA signatures provided by note owners for their notes to be
 * used in a zero-knowledge proof
 * @returns {string} data - concatenated string array of inputSignatures, with the first element being 
 * the length of the inputSignatures variable
 * @returns {Number} length - length of the inputOwners string, divided by 2 because hexadecimal 
 * characters each represent 0.5 bytes
 */
encoderFactory.encodeInputSignatures = (inputSignatures) => {
    const { length } = inputSignatures;
    const signatureString = inputSignatures.map(([v, r, s]) => {
        return `${v.slice(2)}${r.slice(2)}${s.slice(2)}`;
    });
    const data = [padLeft(Number(length).toString(16), 64), ...signatureString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};


/**
 * Encode outputOwners into ABI compatible string array format
 *
 * @method encodeOutputOwners
 * @param {Object[]} outputOwners - owners of notes to be outputted from a zero-knowledge proof
 * used in a zero-knowledge proof
 * @returns {string} data - concatenated string array of outputOwners, with the first element being 
 * the length of the inputSignatures variable
 * @returns {Number} length - length of the inputOwners string, divided by 2 because hexadecimal 
 * characters each represent 0.5 bytes
 */
encoderFactory.encodeOutputOwners = (outputOwners) => {
    const { length } = outputOwners;
    const ownerStrings = outputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

/**
 * Encode metadata of AZTEC notes into ABI compatible string array format
 *
 * @method encodeMetadata
 * @param {Object[]} notes - AZTEC notes
 * @returns {string} data - string comprising offsets to elements in the note metadata, followed
 * by the length of the metadata and then the information representing the metadata
 * @returns {Number} length - length of the inputOwners string, divided by 2 because hexadecimal 
 * characters each represent 0.5 bytes
 */
encoderFactory.encodeMetadata = (notes) => {
    const metadata = notes
        .map(n => secp256k1.compress(n.ephemeral.getPublic()))
        .map(m => `${padLeft('21', 64)}${m.slice(2)}`);
    const { length } = metadata;
    const offsets = metadata.reduce((acc, data) => {
        return [
            ...acc,
            acc[acc.length - 1] + (data.length / 2),
        ];
    }, [0x40 + (length * 0x20)]);
    const data = [
        padLeft((offsets.slice(-1)[0] - 0x20).toString(16), 64),
        padLeft(Number(length).toString(16), 64),
        ...offsets.slice(0, -1).map(o => padLeft(o.toString(16), 64)),
        ...metadata,
    ].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

/**
 * Encode metadata of AZTEC notes into ABI compatible string array format
 *
 * @method encode
 * @param {Object[]} config - configuration instructions for the encoding, dependent on the 
 * proofType variable
 * @param {string[]} abiParams - parameters to be ABI encoded, via methods of the encoderFactory module
 * @param {string} proofType - name of the proof for which data is being submitted. Used to choose the
 * the appropriate type of encoding, as it is proof specific
 * @returns {string} data - hexadecimal concatenated string of parameters encoded according to the ABI 
 * spec of that particular proof
 */
encoderFactory.encode = (config, abiParams, proofType) => {
    let abiEncodedParameters;

    const encodedParameters = abiParams.reduce((acc, parameter) => {
        const encodedData = config[parameter];
        acc.push(encodedData.data);
        return acc;
    }, []);
    const { offsets } = encodedParameters.reduce((acc, encodedParameter) => {
        acc.offsets.push(padLeft(acc.offset.toString(16), 64));
        acc.offset += (encodedParameter.length) / 2;
        return acc;
    }, {
        offset: (Object.keys(config).length + 1) * 32,
        offsets: [],
    });

    if (proofType === 'bilateralSwap') {
        abiEncodedParameters = [config.CHALLENGE, ...offsets, ...encodedParameters];
    } else if (proofType === 'joinSplit') {
        abiEncodedParameters = [config.M, config.CHALLENGE, config.PUBLIC_OWNER, ...offsets, ...encodedParameters];
    } else if (proofType === 'dividendComputation') {
        abiEncodedParameters = [config.CHALLENGE, config.ZA, config.ZB, ...offsets, ...encodedParameters];
    } else if (proofType === 'mint') {
        abiEncodedParameters = [config.CHALLENGE, ...offsets, ...encodedParameters];
    } else if (proofType === 'burn') {
        abiEncodedParameters = [config.CHALLENGE, ...offsets, ...encodedParameters];
    } else {
        throw new Error('incorrect proof name input');
    }
    return `0x${abiEncodedParameters.join('')}`.toLowerCase();
};

module.exports = encoderFactory;
