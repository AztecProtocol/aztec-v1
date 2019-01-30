const { padLeft } = require('web3-utils');

const secp256k1 = require('../../secp256k1');
const outputCoder = require('./outputCoder');

const abiEncoderJoinSplit = {};
abiEncoderJoinSplit.outputCoder = outputCoder;

const abi = {
    M: 0,
    CHALLENGE: 1,
    PUBLIC_OWNER: 2,
    PROOF_DATA: 3,
    INPUT_SIGNATURES: 4,
    OUTPUT_OWNERS: 5,
    METADATA: 6,
    START_DATA: 7,
};

function encodeNote(notes) {
    return notes.map(note => padLeft(note.slice(2), 64)).join('');
}

function encodeProofData(proofData) {
    const { length } = proofData;
    console.log('proof data: ', proofData);
    const noteString = proofData.map(notes => encodeNote(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

abiEncoderJoinSplit.encodeInputSignatures = (inputSignatures) => {
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

function encodeOutputOwners(outputOwners) {
    const { length } = outputOwners;
    const ownerStrings = outputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

abiEncoderJoinSplit.encodeMetadata = (notes) => {
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

abiEncoderJoinSplit.encode = (proofData, m, challenge, publicOwner, inputSignatures, outputOwners, metadata) => {
    const parameters = [];
    parameters[abi.M] = padLeft(Number(m).toString(16), 64);
    parameters[abi.CHALLENGE] = challenge.slice(2);
    parameters[abi.PUBLIC_OWNER] = padLeft(publicOwner.slice(2), 64);
    parameters[abi.PROOF_DATA] = '';
    parameters[abi.INPUT_SIGNATURES] = '';
    parameters[abi.OUTPUT_OWNERS] = '';
    parameters[abi.METADATA] = '';
    let offset = (abi.START_DATA + 1) * 32;
    const formattedProofData = encodeProofData(proofData);
    parameters[abi.PROOF_DATA] = padLeft(offset.toString(16), 64);
    offset += formattedProofData.length;
    const formattedInputSignatures = abiEncoderJoinSplit.encodeInputSignatures(inputSignatures);
    parameters[abi.INPUT_SIGNATURES] = padLeft(offset.toString(16), 64);
    offset += formattedInputSignatures.length;
    const formattedOutputOwners = encodeOutputOwners(outputOwners);
    parameters[abi.OUTPUT_OWNERS] = padLeft(offset.toString(16), 64);
    offset += formattedOutputOwners.length;
    const formattedMetadata = abiEncoderJoinSplit.encodeMetadata(metadata);
    parameters[abi.METADATA] = padLeft(offset.toString(16), 64);

    parameters.push(formattedProofData.data);
    parameters.push(formattedInputSignatures.data);
    parameters.push(formattedOutputOwners.data);
    parameters.push(formattedMetadata.data);
    return `0x${parameters.join('')}`.toLowerCase();
};

module.exports = abiEncoderJoinSplit;
