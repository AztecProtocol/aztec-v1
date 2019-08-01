/**
 * metaData utility functions
 *
 * @module module:metaData
 */
const metaData = {};
const { constants } = require('@aztec/dev-utils');
const { padLeft } = require('web3-utils');

/**
 * Generate the metadata for a set of notes
 *
 * Need to return the notes, with the .ephemeral updated and the metadata object
 * @param {Object[]} notes all notes to be used in the zero-knowledge proof
 * @param {Array} allNoteCustomData
 *
 */
metaData.extractNoteMetadata = (notes) => {
    const extractedMetaData = notes.map((individualNote) => {
        // const noteMetadataLength = (individualNote.metadata.length/2).toString(16);
        // 0x41, as this is the length of the note's metadata (ephemeral key + customData)

        // ephemeralKey = 0x21. Individual metadata = 0x177
        return `${padLeft('0x198', 64)}${individualNote.metadata.slice(2)}`.slice(2);
    });

    const { length } = extractedMetaData;

    const offsets = extractedMetaData.reduce(
        (acc, data) => {
            return [...acc, acc[acc.length - 1] + data.length / 2];
        },
        [0x40 + length * 0x20],
    );

    const data = [
        padLeft((offsets.slice(-1)[0] - 0x20).toString(16), 64), // length, number of bytes
        padLeft(Number(length).toString(16), 64), // number of notes
        ...offsets.slice(0, -1).map((o) => padLeft(o.toString(16), 64)), // offsets to the info for different notes
        ...extractedMetaData,
    ].join('');
    return data;
};

module.exports = metaData;
