const secp256k1 = require('@aztec/secp256k1');

const { padLeft } = require('web3-utils');

const inputCoder = {};

/**
 * Encode input signatures into ABI compatible string array format
 *
 * @method encodeInputSignatures
 * @param {Object[]} inputSignatures - ECDSA signatures provided by note owners for their notes to be
 * used in a zero-knowledge proof
 * @returns {string} data - concatenated string array of inputSignatures, with the first element being
 * the length of the inputSignatures variable
 * @returns {Number} length - length of the inputOwners string, divided by 2 because hexadecimal
 * characters each represent 0.5 bytes
 */
inputCoder.encodeInputSignatures = (inputSignatures) => {
    const { length } = inputSignatures;
    const signatureString = inputSignatures.map(([v, r, s]) => {
        return `${v.slice(2)}${r.slice(2)}${s.slice(2)}`;
    });
    const data = [padLeft(Number(length).toString(16), 64), ...signatureString].join('');
    return data;
};


inputCoder.encodeMetadata = (standardData) => {
    /**
    * metadata here is the outputNotes supplied to a proof
    * this function goes through each note (n = note), selects the
    * ephemeral publicKey of the note and extracts the publicKey representation
    * of the note
    * 
    * For each note publicKey, it then prepends '21' and pads left
    */
    console.log('output notes: ', standardData);
    const encodedMetadata = standardData
        .map((n) => secp256k1.compress(n.ephemeral.getPublic()))
        .map((m) => `${padLeft('21', 64)}${m.slice(2)}`);
    const { length } = encodedMetadata;
    const offsets = encodedMetadata.reduce(
        (acc, data) => {
            return [...acc, acc[acc.length - 1] + data.length / 2];
        },
        [0x40 + length * 0x20],
    );

    const data = [
        padLeft((offsets.slice(-1)[0] - 0x20).toString(16), 64),
        padLeft(Number(length).toString(16), 64),
        ...offsets.slice(0, -1).map((o) => padLeft(o.toString(16), 64)),
        ...encodedMetadata,
    ].join('');
    return data;
};

/**
 * Encode an AZTEC note into ABI compatible string array format
 *
 * @method encodeNote
 * @param {note[]} notes - array of AZTEC notes
 * @returns {string} notes - an array of AZTEC notes in a string array format
 */
inputCoder.encodeNotes = (notes) => {
    return notes.map((note) => padLeft(note.slice(2), 64)).join('');
};

/**
 * Encode outputOwners into ABI compatible string array format
 *
 * @method encodeOwners
 * @param {Object[]} owners - owners of notes from a zero-knowledge proof
 * @returns {string} data - concatenated string array of owners, with the first element being length
 * the length of the owners array
 * @returns {Number} length - length of the owners string, divided by 2 because hexadecimal
 * characters each represent 0.5 bytes
 */
inputCoder.encodeOwners = (owners) => {
    const { length } = owners;
    const ownerStrings = owners.map((o) => padLeft(o.slice(2), 64));
    return [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
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
inputCoder.encodeProofData = (proofData) => {
    const { length } = proofData;
    const noteString = proofData.map((notes) => inputCoder.encodeNotes(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return data;
};

module.exports = inputCoder;
