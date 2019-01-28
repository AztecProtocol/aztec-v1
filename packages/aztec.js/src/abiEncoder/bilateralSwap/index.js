const { padLeft } = require('web3-utils');

const secp256k1 = require('../../secp256k1');
const outputCoder = require('./outputCoder');

const bilateralSwap = {};
bilateralSwap.outputCoder = outputCoder;

const abi = {
    CHALLENGE: 0,
    PROOF_DATA: 1,
    INPUT_OWNERS: 2,
    OUTPUT_OWNERS: 3,
    METADATA: 4,
    START_DATA: 5, // these numbers are index positions for parameters later on
};

function encodeNote(notes) {
    return notes.map(note =>
        padLeft(note.slice(2), 64)).join('');
}

function encodeProofData(proofData) {
    const { length } = proofData;
    const noteString = proofData.map(notes => encodeNote(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}


function encodeInputOwners(inputOwners) {
    const { length } = inputOwners;
    const ownerStrings = inputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

function encodeOutputOwners(outputOwners) {
    const { length } = outputOwners;
    const ownerStrings = outputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

bilateralSwap.encodeMetadata = (notes) => {
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

// the output of all this becomes the proof data
bilateralSwap.encode = (proofData, challenge, inputOwners, outputOwners, metadata) => {
    const parameters = [];
    parameters[abi.CHALLENGE] = challenge.slice(2); // 0x00 - 0x20
    parameters[abi.PROOF_DATA] = ''; // 0x20 - 0x40
    parameters[abi.INPUT_OWNERS] = ''; // 0x40 - 0x60
    parameters[abi.OUTPUT_OWNERS] = ''; // 0x60 - 0x80
    parameters[abi.METADATA] = ''; // 0x80 - 0xA0
    let offset = (abi.START_DATA + 1) * 32; // setting an offset to just over the first entry in these bytes arguments
    const formattedProofData = encodeProofData(proofData); // just formatting the proof data
    parameters[abi.PROOF_DATA] = padLeft(offset.toString(16), 64); // putting the offset in
    offset += formattedProofData.length; // increasing the offset by the length of the formatted proof data
    const formattedInputOwners = encodeInputOwners(inputOwners);
    parameters[abi.INPUT_OWNERS] = padLeft(offset.toString(16), 64);
    offset += formattedInputOwners.length;
    const formattedOutputOwners = encodeOutputOwners(outputOwners);
    parameters[abi.OUTPUT_OWNERS] = padLeft(offset.toString(16), 64);
    offset += formattedOutputOwners.length;
    const formattedMetadata = bilateralSwap.encodeMetadata(metadata);
    parameters[abi.METADATA] = padLeft(offset.toString(16), 64);

    parameters.push(formattedProofData.data);
    parameters.push(formattedInputOwners.data);
    parameters.push(formattedOutputOwners.data);
    parameters.push(formattedMetadata.data);
    return `0x${parameters.join('')}`.toLowerCase();
};

module.exports = bilateralSwap;
