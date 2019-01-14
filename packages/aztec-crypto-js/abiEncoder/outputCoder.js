const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const bn128 = require('../bn128/bn128');
const secp256k1 = require('../secp256k1/secp256k1');

const outputCoder = {};

outputCoder.decodeNote = (note) => {
    const length = parseInt(note.slice(0, 32), 16);
    if ((note.length / 2) !== 0xe1 || (length !== 0xe1)) {
        throw new Error(`invalid length of ${note}`);
    }
    const owner = note.slice(32, 64);
    const noteHash = note.slice(64, 96);
    const metadataLength = parseInt(note.slice(96, 128), 16);
    if (metadataLength !== 0x61) {
        throw new Error(`invalid metadata length of ${note}`);
    }
    const gamma = bn128.decompress(new BN(note.slice(128, 160)));
    const sigma = bn128.decompress(new BN(note.slice(160, 192)));

    const ephemeral = secp256k1.decompress(new BN(note.slice(192, 224)), new BN(note.slice(224, 225)));
    return {
        owner,
        noteHash,
        gamma,
        sigma,
        ephemeral,
    };
};

outputCoder.decodeNotes = (notes) => {
    const byteLength = notes.slice(0, 32);
    const n = parseInt(notes.slice(32, 64), 16);
    if (byteLength !== ((n * 0x101) + 0x20)) {
        throw new Error(`expected ${byteLength} to equal ${((n * 0x101) + 0x20)}, of ${notes}`);
    }
    return [...new Array(n)].map((x, i) => {
        const noteOffset = parseInt(notes.slice(64 + (i * 32), 96 + (i * 32)), 16);
        return outputCoder.decodeNote(notes.slice(noteOffset));
    });
};

outputCoder.decodeProofOutput = (proofOutput) => {
    const byteLength = parseInt(proofOutput.slice(0, 32), 16);
    const inputNotesOffset = parseInt(proofOutput.slice(32, 64), 16);
    const outputNotesOffset = parseInt(proofOutput.slice(64, 92), 16);
    const publicOwner = proofOutput.slice(92, 128);
    const publicValue = proofOutput.slice(128, 160);
    const inputNotes = outputCoder.decodeNotes(proofOutput.slice(inputNotesOffset));
    const outputNotes = outputCoder.decodeNotes(proofOutput.slice(outputNotesOffset));

    const numNotes = inputNotes.length + outputNotes.length;
    const notesLength = 0x80 + (0x101 * numNotes);
    const proofDataLength = 0xa0 + notesLength;
    if (byteLength !== proofDataLength) {
        throw new Error(`abi.decodeProofOutput, expected ${byteLength} to equal ${proofDataLength}, of ${proofOutput}`);
    }
    return {
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    };
};

outputCoder.decodeProofOutputs = (proofOutputsHex) => {
    const proofOutputs = proofOutputsHex.slice(2);
    const { length } = proofOutputs;
    if (parseInt(proofOutputs.slice(0, 32), 16) !== (length / 2)) {
        throw new Error(`${proofOutputsHex} length does not match ${length / 2}`);
    }
    const numOutputs = parseInt(proofOutputs.slice(32, 64), 16);
    return [...new Array(numOutputs)].map((x, i) => {
        const outputOffset = parseInt(proofOutputs.slice(64 + (i * 32), 96 + (i * 32)), 16);
        return outputCoder.decodeProofOutput(proofOutputs.slice(outputOffset));
    });
};

outputCoder.encodeNote = (note) => {
    const encoded = [...new Array(7)];
    encoded[0] = padLeft('e1', 64);
    encoded[1] = padLeft(note.owner.slice(2), 64);
    encoded[2] = padLeft(note.noteHash.slice(2), 64);
    encoded[3] = padLeft('61', 64);
    encoded[4] = padLeft(bn128.compress(note.gamma.x.fromRed(), note.gamma.y.fromRed()).toString(16), 64);
    encoded[5] = padLeft(bn128.compress(note.sigma.x.fromRed(), note.sigma.y.fromRed()).toString(16), 64);
    encoded[6] = secp256k1.compress(note.ephemeral.getPublic()).slice(2);
    return encoded.join('');
};

outputCoder.encodeNotes = (notes) => {
    const encodedNotes = notes.map(note => outputCoder.encodeNote(note));
    const offsetToData = 0x40 + (0x20 * encodedNotes.length);
    const noteLengths = encodedNotes.reduce((acc, p) => {
        return [...acc, acc[acc.length - 1] + (p.length / 2)];
    }, [offsetToData]);

    const encoded = [
        padLeft(noteLengths.slice(-1)[0].toString(16), 64),
        padLeft(notes.length.toString(16), 64),
        ...noteLengths.slice(0, -1).map(n => padLeft(n.toString(16), 64)),
        ...encodedNotes,
    ];
    return encoded.join('');
};

outputCoder.encodeProofOutput = ({
    inputNotes,
    outputNotes,
    publicOwner,
    publicValue,
}) => {
    const encodedInputNotes = outputCoder.encodeNotes(inputNotes);
    const encodedOutputNotes = outputCoder.encodeNotes(outputNotes);
    const encoded = [...new Array(6)];
    encoded[0] = padLeft((0xa0 + ((encodedInputNotes.length + encodedOutputNotes.length) / 2)).toString(16), 64);
    encoded[1] = padLeft('a0', 64);
    encoded[2] = padLeft((0xa0 + (encodedInputNotes.length / 2)).toString(16), 64);
    encoded[3] = padLeft(publicOwner.slice(2), 64);
    encoded[4] = padLeft(publicValue.toString(16), 64);
    encoded[5] = encodedInputNotes;
    encoded[6] = encodedOutputNotes;
    return encoded.join('');
};

outputCoder.encodeProofOutputs = (proofOutputs) => {
    const encodedProofOutputs = proofOutputs.map(proofOutput => outputCoder.encodeProofOutput(proofOutput));
    const offsetToData = 0x40 + (0x20 * proofOutputs.length);
    const proofLengths = encodedProofOutputs.reduce((acc, p) => {
        return [...acc, acc[acc.length - 1] + (p.length / 2)];
    }, [offsetToData]);

    const encoded = [
        padLeft(proofLengths.slice(-1)[0].toString(16), 64),
        padLeft(proofOutputs.length.toString(16), 64),
        ...proofLengths.slice(0, -1).map(n => padLeft(n.toString(16), 64)),
        ...encodedProofOutputs,
    ];
    return encoded.join('');
};

module.exports = outputCoder;
