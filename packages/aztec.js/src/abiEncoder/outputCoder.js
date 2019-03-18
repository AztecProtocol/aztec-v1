const { padLeft, sha3 } = require('web3-utils');
const BN = require('bn.js');

const bn128 = require('../bn128');
const secp256k1 = require('../secp256k1');

const outputCoder = {};

outputCoder.decodeOutputNote = (note) => {
    const length = parseInt(note.slice(0x00, 0x40), 16);

    const owner = `0x${note.slice(0x58, 0x80)}`;
    const noteHash = `0x${note.slice(0x80, 0xc0)}`;
    const metadataLength = parseInt(note.slice(0xc0, 0x100), 16);
    let ephemeral = null;
    if (metadataLength === 0x61) {
        ephemeral = secp256k1.decompressHex(note.slice(0x180, 0x1c2));
    }
    const gamma = bn128.decompressHex(note.slice(0x100, 0x140));
    const sigma = bn128.decompressHex(note.slice(0x140, 0x180));
    const expectedLength = (metadataLength === 0x61) ? 0xc1 : 0xa0;
    if (length !== expectedLength) {
        throw new Error(`invalid length of ${length.toString(16)}`);
    }
    return {
        owner,
        noteHash,
        gamma,
        sigma,
        ephemeral,
    };
};

outputCoder.decodeInputNote = (note) => {
    const length = parseInt(note.slice(0x00, 0x40), 16);

    const owner = `0x${note.slice(0x58, 0x80)}`;
    const noteHash = `0x${note.slice(0x80, 0xc0)}`;
    const metadataLength = parseInt(note.slice(0xc0, 0x100), 16);
    let ephemeral = null;
    if (metadataLength === 0x61) {
        ephemeral = secp256k1.decompressHex(note.slice(0x180, 0x1c2));
    }
    const gamma = bn128.decompressHex(note.slice(0x100, 0x140));
    const sigma = bn128.decompressHex(note.slice(0x140, 0x180));
    const expectedLength = (metadataLength === 0x61) ? 0xc1 : 0xa0;
    if (length !== expectedLength) {
        throw new Error(`invalid length of ${length.toString(16)}`);
    }
    return {
        owner,
        noteHash,
        gamma,
        sigma,
        ephemeral,
    };
};


outputCoder.decodeNotes = (notes, isOutput) => {
    const n = parseInt(notes.slice(0x40, 0x80), 16);
    return [...new Array(n)].map((x, i) => {
        const noteOffset = parseInt(notes.slice(0x80 + (i * 0x40), 0xc0 + (i * 0x40)), 16);
        if (isOutput) {
            return outputCoder.decodeOutputNote(notes.slice(noteOffset * 2));
        }
        return outputCoder.decodeInputNote(notes.slice(noteOffset * 2));
    });
};

outputCoder.decodeProofOutput = (proofOutput) => {
    const inputNotesOffset = parseInt(proofOutput.slice(0x40, 0x80), 16);
    const outputNotesOffset = parseInt(proofOutput.slice(0x80, 0xc0), 16);
    const publicOwner = `0x${proofOutput.slice(0xd8, 0x100)}`;
    const publicValue = new BN(proofOutput.slice(0x100, 0x140), 16).fromTwos(256).toNumber();
    const inputNotes = outputCoder.decodeNotes(proofOutput.slice(inputNotesOffset * 2), false);
    const outputNotes = outputCoder.decodeNotes(proofOutput.slice(outputNotesOffset * 2), true);

    return {
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    };
};

outputCoder.decodeProofOutputs = (proofOutputsHex) => {
    const proofOutputs = proofOutputsHex.slice(2);
    const numOutputs = parseInt(proofOutputs.slice(0x40, 0x80), 16);
    const result = [...new Array(numOutputs)].map((x, i) => {
        const outputOffset = parseInt(proofOutputs.slice(0x80 + (i * 0x40), 0xc0 + (i * 0x40)), 16);
        return outputCoder.decodeProofOutput(proofOutputs.slice(outputOffset * 2));
    });

    return result;
};

outputCoder.getProofOutput = (proofOutputsHex, i) => {
    const proofOutputs = proofOutputsHex.slice(2);
    const offset = parseInt(proofOutputs.slice(0x40 + (0x40 * i), 0x80 + (0x40 * i)), 16);
    const length = parseInt(proofOutputs.slice((offset * 2) - 0x40, (offset * 2)), 16);
    return proofOutputs.slice((offset * 2) - 0x40, (offset * 2) + (length * 2));
};

outputCoder.hashProofOutput = (proofOutput) => {
    return sha3(`0x${proofOutput.slice(0x40)}`);
};

outputCoder.encodeOutputNote = (note) => {
    const encoded = [...new Array(7)];
    encoded[0] = padLeft('c1', 64);
    encoded[1] = padLeft(note.owner.slice(2), 64);
    encoded[2] = padLeft(note.noteHash.slice(2), 64);
    encoded[3] = padLeft('61', 64);
    encoded[4] = padLeft(bn128.compress(note.gamma.x.fromRed(), note.gamma.y.fromRed()).toString(16), 64);
    encoded[5] = padLeft(bn128.compress(note.sigma.x.fromRed(), note.sigma.y.fromRed()).toString(16), 64);
    encoded[6] = secp256k1.compress(note.ephemeral.getPublic()).slice(2);
    return encoded.join('');
};

outputCoder.encodeInputNote = (note) => {
    const encoded = [...new Array(6)];
    encoded[0] = padLeft('a0', 64);
    encoded[1] = padLeft(note.owner.slice(2), 64);
    encoded[2] = padLeft(note.noteHash.slice(2), 64);
    encoded[3] = padLeft('40', 64);
    encoded[4] = padLeft(bn128.compress(note.gamma.x.fromRed(), note.gamma.y.fromRed()).toString(16), 64);
    encoded[5] = padLeft(bn128.compress(note.sigma.x.fromRed(), note.sigma.y.fromRed()).toString(16), 64);
    return encoded.join('');
};

outputCoder.encodeNotes = (notes, isOutput) => {
    let encodedNotes;
    if (isOutput) {
        encodedNotes = notes.map((note) => {
            if (note.forceNoMetadata) {
                return outputCoder.encodeInputNote(note, isOutput);
            }
            return outputCoder.encodeOutputNote(note, isOutput);
        });
    } else {
        encodedNotes = notes.map((note) => {
            if (note.forceMetadata) {
                return outputCoder.encodeOutputNote(note, isOutput);
            }
            return outputCoder.encodeInputNote(note, isOutput);
        });
    }
    const offsetToData = 0x40 + (0x20 * encodedNotes.length);
    const noteLengths = encodedNotes.reduce((acc, p) => {
        return [...acc, acc[acc.length - 1] + (p.length / 2)];
    }, [offsetToData]);

    const encoded = [
        padLeft((noteLengths.slice(-1)[0] - 0x20).toString(16), 64),
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
    const encodedInputNotes = outputCoder.encodeNotes(inputNotes, false);
    const encodedOutputNotes = outputCoder.encodeNotes(outputNotes, true);
    let formattedValue;
    if (publicValue < 0) {
        formattedValue = padLeft(new BN(publicValue).toTwos(256).toString(16), 64);
    } else {
        formattedValue = padLeft(publicValue.toString(16), 64);
    }
    const encoded = [...new Array(7)];
    encoded[0] = padLeft((0x80 + ((encodedInputNotes.length + encodedOutputNotes.length) / 2)).toString(16), 64);
    encoded[1] = padLeft('a0', 64);
    encoded[2] = padLeft((0xa0 + (encodedInputNotes.length / 2)).toString(16), 64);
    encoded[3] = padLeft(publicOwner.slice(2), 64);
    encoded[4] = formattedValue;
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
        padLeft((proofLengths.slice(-1)[0] - 0x20).toString(16), 64),
        padLeft(proofOutputs.length.toString(16), 64),
        ...proofLengths.slice(0, -1).map(n => padLeft(n.toString(16), 64)),
        ...encodedProofOutputs,
    ];
    return `0x${encoded.join('')}`.toLowerCase();
};

module.exports = outputCoder;
