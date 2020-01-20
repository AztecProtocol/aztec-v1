import { padLeft } from 'web3-utils';

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
export function encodeInputSignatures(inputSignatures) {
    const { length } = inputSignatures;
    const signatureString = inputSignatures.map(([v, r, s]) => {
        return `${v.slice(2)}${r.slice(2)}${s.slice(2)}`;
    });
    const data = [padLeft(Number(length).toString(16), 64), ...signatureString].join('');
    return data;
}

/**
 * Encode the metaData of multiple notes into ABI compatible string array format
 *
 * @method encodeMetadata
 * @param notes - array of notes with metadata as part of their schema
 * @returns {String} ABI encoded representation of the notes metaData
 */
export function encodeMetaData(notes) {
    const exportedMetaData = notes.map((individualNote) => {
        return individualNote.exportMetaData();
    });

    const { length } = exportedMetaData;
    const offsets = exportedMetaData.reduce(
        (acc, data) => {
            return [...acc, acc[acc.length - 1] + data.length / 2];
        },
        [0x40 + length * 0x20],
    );

    const data = [
        padLeft((offsets.slice(-1)[0] - 0x20).toString(16), 64), // length, number of bytes
        padLeft(Number(length).toString(16), 64), // number of notes
        ...offsets.slice(0, -1).map((o) => padLeft(o.toString(16), 64)), // offsets to the info for different notes
        ...exportedMetaData,
    ].join('');
    return data;
}

/**
 * Encode an AZTEC note into ABI compatible string array format
 *
 * @method encodeNote
 * @param {note[]} notes - array of AZTEC notes
 * @returns {string} notes - an array of AZTEC notes in a string array format
 */
export function encodeNotes(notes) {
    return notes.map((note) => padLeft(note.slice(2), 64)).join('');
}

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
export function encodeOwners(owners) {
    const { length } = owners;
    const ownerStrings = owners.map((o) => padLeft(o.slice(2), 64));
    return [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
}

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
export function encodeProofData(proofData) {
    const { length } = proofData;
    const noteString = proofData.map((notes) => encodeNotes(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return data;
}
