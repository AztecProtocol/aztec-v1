/**
 * Output ABI encoding function
 * @module outputCoder
 */

import * as bn128 from '@aztec/bn128';

import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { keccak256, padLeft } from 'web3-utils';
/**
 * Decode a note
 *
 * @method decodeNote
 * @param {note} note - AZTEC note
 * @returns {Object[]} note variables - extracted variables: noteType, owner,
 * noteHash, gamma, sigma, ephemeral
 */
export function decodeNote(note) {
    const length = parseInt(note.slice(0x00, 0x40), 16);
    const noteType = parseInt(note.slice(0x40, 0x80), 16);
    const owner = `0x${note.slice(0x98, 0xc0)}`;
    const noteHash = `0x${note.slice(0xc0, 0x100)}`;
    let ephemeral;

    if (length === 0xc0) {
        // inputNote, no metaData attached
        ephemeral = null;
    } else {
        ephemeral = secp256k1.decompressHex(note.slice(0x1c0, 0x202));
    }

    const gamma = bn128.decompressHex(note.slice(0x140, 0x180));
    const sigma = bn128.decompressHex(note.slice(0x180, 0x1c0));

    return {
        noteType,
        owner,
        noteHash,
        gamma,
        sigma,
        ephemeral,
    };
}

/**
 * Decode an array of notes
 *
 * @method decodeNotes
 * @param {note} notes - array of AZTEC notes
 * @returns {Object[]} array of note variables - array of decoded and extracted note variables
 * where each element corresponds to the note variables for an individual note
 */
export function decodeNotes(notes) {
    const n = parseInt(notes.slice(0x40, 0x80), 16);
    return Array(n)
        .fill()
        .map((x, i) => {
            const noteOffset = parseInt(notes.slice(0x80 + i * 0x40, 0xc0 + i * 0x40), 16);
            return decodeNote(notes.slice(noteOffset * 2));
        });
}

/**
 * Decode a bytes proofOutput string into it's constitutent objects
 *
 * @method decodeProofOutput
 * @param {Object} proofOutput - bytes proofOutput string, outputted from a zero-knowledge proof
 * @returns {Object[]} decoded constituent proofOutput objects - including inputNotes, outputNotes,
 * publicOwner, publicValue and the challenge
 */
export function decodeProofOutput(proofOutput) {
    const inputNotesOffset = parseInt(proofOutput.slice(0x40, 0x80), 16);
    const outputNotesOffset = parseInt(proofOutput.slice(0x80, 0xc0), 16);
    const publicOwner = `0x${proofOutput.slice(0xd8, 0x100)}`;
    const publicValue = new BN(proofOutput.slice(0x100, 0x140), 16).fromTwos(256).toNumber();
    const challenge = `0x${proofOutput.slice(0x140, 0x180)}`;
    const inputNotes = decodeNotes(proofOutput.slice(inputNotesOffset * 2));
    const outputNotes = decodeNotes(proofOutput.slice(outputNotesOffset * 2));

    return {
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
        challenge,
    };
}

/**
 * Decode a bytes proofOutputs object into the constituent variables of each
 * individual bytes proofOutput object
 *
 * @method decodeProofOutputs
 * @param {string} proofOutputsHex - bytes proofOutputs string, containing multiple individual bytes
 * proofOutput objects
 * @returns {Object[]} array of decoded proofOutput objects - each element contains the
 * publicValue and the challenge
 */
export function decodeProofOutputs(proofOutputsHex) {
    const proofOutputs = proofOutputsHex.slice(2);
    const numOutputs = parseInt(proofOutputs.slice(0x40, 0x80), 16);
    const result = Array(numOutputs)
        .fill()
        .map((x, i) => {
            const outputOffset = parseInt(proofOutputs.slice(0x80 + i * 0x40, 0xc0 + i * 0x40), 16);
            return decodeProofOutput(proofOutputs.slice(outputOffset * 2));
        });

    return result;
}

/**
 * Encode an output note, according to the ABI encoding specification
 *
 * @method encodeNote
 * @param {note} note - AZTEC note
 * @param {bool} encodeMetaData - boolean controlling whether metaData is to be encoded or not. Typically, if
 * inputNotes are being encoded the metadata is not encoded whereas if outputNotes are being encoded then
 * the metaData is encoded
 * @returns {string} the various components of an AZTEC output note, encoded appropriately and concatenated
 * together
 */
export function encodeNote(note, encodeMetaData) {
    let encoded;
    let metaDataSize;

    if (encodeMetaData) {
        encoded = Array(8).fill();
        encoded[7] = note.metaData.slice(2);
        metaDataSize = parseInt(note.metaData.slice(2).length / 2, 10);
    } else {
        encoded = Array(7).fill();
        metaDataSize = 0;
    }

    const noteDataLength = (0x20 * 2 + metaDataSize).toString(16);
    const noteLength = (0x20 * 4 + 0x20 * 2 + metaDataSize).toString(16);

    encoded[0] = padLeft(noteLength, 64);
    encoded[1] = padLeft('1', 64);
    encoded[2] = padLeft(note.owner.slice(2), 64);
    encoded[3] = padLeft(note.noteHash.slice(2), 64);
    encoded[4] = padLeft(noteDataLength, 64);
    encoded[5] = padLeft(bn128.compress(note.gamma.x.fromRed(), note.gamma.y.fromRed()).toString(16), 64);
    encoded[6] = padLeft(bn128.compress(note.sigma.x.fromRed(), note.sigma.y.fromRed()).toString(16), 64);
    return encoded.join('');
}

/**
 * Encode an array of notes according to the ABI specification. Able to encode both input and output
 * notes
 *
 * @method encodeNotes
 * @param {note[]} notes - array of AZTEC notes
 * @param {boolean} encodeMetaData - boolean controlling whether metaData is to be encoded or not. Typically, if
 * inputNotes are being encoded the metadata is not encoded whereas if outputNotes are being encoded then
 * the metaData is encoded
 * @returns {string} ABI encoded representation of the notes array
 */
export function encodeNotes(notes, encodeMetaData) {
    const encodedNotes = notes.map((note) => {
        return encodeNote(note, encodeMetaData);
    });
    const offsetToData = 0x40 + 0x20 * encodedNotes.length;
    const noteLengths = encodedNotes.reduce(
        (acc, p) => {
            return [...acc, acc[acc.length - 1] + p.length / 2];
        },
        [offsetToData],
    );

    const encoded = [
        padLeft((noteLengths.slice(-1)[0] - 0x20).toString(16), 64),
        padLeft(notes.length.toString(16), 64),
        ...noteLengths.slice(0, -1).map((n) => padLeft(n.toString(16), 64)),
        ...encodedNotes,
    ];
    return encoded.join('');
}

/**
 * Encode a proofOutput object according to the ABI specification
 *
 * @method encodeProofOutput
 * @param {note[]} inputNotes - array of notes to be input to a zero-knowledge proof
 * @param {note[]} outputNotes - array of notes to be output from a zero-knowledge proof
 * @param {address} publicOwner - Ethereum address of the account
 * @param {Number} publicValue - quantity of public ERC20 tokens input to the zero-knowledge proof
 * @param {string} challenge - cryptographic challenge variable, part of the sigma protocol
 * @returns {string} ABI encoded representation of the proofOutput object
 */
export function encodeProofOutput({ inputNotes, outputNotes, publicOwner, publicValue, challenge }) {
    const encodedInputNotes = encodeNotes(inputNotes, false);
    const encodedOutputNotes = encodeNotes(outputNotes, true);
    let formattedValue;
    // TODO: store this constant somewhere else and also explain what it does
    const predicate = new BN('10944121435919637611123202872628637544274182200208017171849102093287904247808', 10);
    let adjustedPublicValue = publicValue;
    if (publicValue.gt(predicate)) {
        adjustedPublicValue = publicValue.sub(bn128.groupModulus);
    }
    if (adjustedPublicValue.lt(new BN(0))) {
        formattedValue = padLeft(new BN(adjustedPublicValue).toTwos(256).toString(16), 64);
    } else {
        formattedValue = padLeft(adjustedPublicValue.toString(16), 64);
    }
    const encoded = Array(8).fill();
    encoded[0] = padLeft((0xa0 + (encodedInputNotes.length + encodedOutputNotes.length) / 2).toString(16), 64);
    encoded[1] = padLeft('c0', 64);
    encoded[2] = padLeft((0xc0 + encodedInputNotes.length / 2).toString(16), 64);
    encoded[3] = padLeft(publicOwner.slice(2), 64);
    encoded[4] = formattedValue;
    encoded[5] = padLeft(challenge.slice(2), 64);
    encoded[6] = encodedInputNotes;
    encoded[7] = encodedOutputNotes;

    return encoded.join('');
}

/**
 * Encode a proofOutputs object according to the ABI specification
 *
 * @method encodeProofOutputs
 * @param {Object[]} proofOutputs - array of notes to be input to a zero-knowledge proof
 * @returns {string} ABI encoded representation of the proofOutputs object
 */
export function encodeProofOutputs(proofOutputs) {
    const encodedProofOutputs = proofOutputs.map((proofOutput) => encodeProofOutput(proofOutput));
    const offsetToData = 0x40 + 0x20 * proofOutputs.length;
    const proofLengths = encodedProofOutputs.reduce(
        (acc, p) => {
            return [...acc, acc[acc.length - 1] + p.length / 2];
        },
        [offsetToData],
    );

    const encoded = [
        padLeft((proofLengths.slice(-1)[0] - 0x20).toString(16), 64),
        padLeft(proofOutputs.length.toString(16), 64),
        ...proofLengths.slice(0, -1).map((n) => padLeft(n.toString(16), 64)),
        ...encodedProofOutputs,
    ];
    return `0x${encoded.join('')}`.toLowerCase();
}

/**
 * Extract the the input notes from a proof output
 *
 * @method getInputNotes
 * @param {string} proofOutput - the particular proofOutput the user wishes to select
 * @returns (string) input notes extracted from proofOutput
 */
export function getInputNotes(proofOutput) {
    const inputNotesOffset = 2 * parseInt(proofOutput.slice(0x40, 0x80), 16);
    const length = 2 * parseInt(proofOutput.slice(inputNotesOffset, inputNotesOffset + 0x40), 16);
    if (length > 0x0) {
        const inputNotes = proofOutput.slice(inputNotesOffset, inputNotesOffset + 0x40 + length);
        return inputNotes;
    }
    return padLeft('0x0', 64);
}

/**
 * Extract the metadata from a notee
 *
 * @method getMetadata
 * @param {string} notes - bytes note string
 * @returns {strings} extracted bytes metadata
 */
export function getMetadata(note) {
    let metadata = '';
    const gamma = note.slice(0x140, 0x180);
    metadata += gamma;
    const sigma = note.slice(0x180, 0x1c0);
    metadata += sigma;

    const length = parseInt(note.slice(0x00, 0x40), 16);
    let expectedLength;
    const metadataLength = parseInt(note.slice(0x100, 0x140), 16);
    let ephemeral = null;
    if (metadataLength === 0x61) {
        ephemeral = note.slice(0x1c0, 0x202);
        metadata += ephemeral;
        expectedLength = 0xe1;
    } else {
        expectedLength = 0xc0;
    }

    if (length !== expectedLength) {
        throw new Error(`unexpected note length of ${length}`);
    }

    return metadata;
}

/**
 * Extract the note from a bytes notes string
 *
 * @method getNote
 * @param {string} notes - bytes notes string
 * @param {Number} i - index to the particular note the user wishes to select
 * @returns {string} bytes selected note string
 */
export function getNote(notes, i) {
    const noteOffset = 2 * parseInt(notes.slice(0x80 + i * 0x40, 0xc0 + i * 0x40), 16);
    const length = 2 * parseInt(notes.slice(noteOffset, noteOffset + 0x40), 16);
    // Add 0x40 because the length itself has to be included
    return notes.slice(noteOffset, noteOffset + 0x40 + length);
}

/**
 * Extract the the input notes from a proof output
 *
 * @method getOutputNotes
 * @param {string} proofOutput - the particular proofOutput the user wishes to select
 * @returns (string) output notes extracted from proofOutput
 */
export function getOutputNotes(proofOutput) {
    const outputNotesOffset = 2 * parseInt(proofOutput.slice(0x80, 0xc0), 16);
    const length = 2 * parseInt(proofOutput.slice(outputNotesOffset, outputNotesOffset + 0x40), 16);
    if (length > 0x0) {
        const inputNotes = proofOutput.slice(outputNotesOffset, outputNotesOffset + 0x40 + length);
        return inputNotes;
    }
    return padLeft('0x0', 64);
}

/**
 * Decode a bytes proofOutputs object into the constituent variables of each
 * individual bytes proofOutput object
 *
 * @method getProofOutput
 * @param {string} proofOutputsHex - bytes proofOutputs string, containing multiple individual bytes
 * proofOutput objects
 * @param {Number} i - index to the particular proofOutput the user wishes to select
 * @returns {string} selected proofOutput object extracted from proofOutputsHex
 */
export function getProofOutput(proofOutputsHex, i) {
    const proofOutputs = proofOutputsHex.slice(2);
    const offset = parseInt(proofOutputs.slice(0x40 + 0x40 * i, 0x80 + 0x40 * i), 16);
    const length = parseInt(proofOutputs.slice(offset * 2 - 0x40, offset * 2), 16);
    return proofOutputs.slice(offset * 2 - 0x40, offset * 2 + length * 2);
}

/**
 * Decode a bytes proofOutputs object into the constituent variables of each
 * individual bytes proofOutput object
 *
 * @method hashProofOutput
 * @param {Object} proofOutput - proofOutput object, contains transfer instructions
 * @returns {string} keccak256 hash of the proofOutput
 */
export function hashProofOutput(proofOutput) {
    return keccak256(`0x${proofOutput.slice(0x40)}`);
}
