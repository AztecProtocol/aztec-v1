const { padLeft } = require('web3-utils');

const abiEncoder = {};

const abi = {
    M: 0,
    CHALLENGE: 1,
    PROOF_DATA: 2,
    INPUT_SIGNATURES: 3,
    OUTPUT_OWNERS: 4,
    METADATA: 5,
    START_DATA: 6,
};

function encodeNote(notes) {
    return notes.map(note => padLeft(note.slice(2), 64)).join('');
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

function encodeInputSignatures(inputSignatures) {
    const { length } = inputSignatures;
    const signatureString = inputSignatures.map(([v, r, s]) => {
        return `${v.slice(2)}${r.slice(2)}${s.slice(2)}`;
    });
    const data = [padLeft(Number(length).toString(16), 64), ...signatureString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

function encodeOutputOwners(outputOwners) {
    const { length } = outputOwners;
    const ownerStrings = outputOwners.map(o => padLeft(o.slice(2), 32));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

function encodeMetadata(metadata) {
    const { length } = metadata;
    const metadatas = metadata.map(data => data.slice(2));
    const offsets = metadatas.reduce((acc, data) => {
        return [
            ...acc,
            acc[acc.length - 1] + data.length / 2,
        ];
    }, [32]).slice(0, -1);
    const data = [
        padLeft(Number(length).toString(16), 64),
        ...offsets,
        ...metadata,
    ].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
}

abiEncoder.encode = (proofData, m, challenge, inputSignatures, outputOwners, metadata) => {
    const parameters = [];
    parameters[abi.M] = padLeft(Number(m).toString(16), 64);
    parameters[abi.CHALLENGE] = challenge.slice(2);
    parameters[abi.PROOF_DATA] = '';
    parameters[abi.INPUT_SIGNATURES] = '';
    parameters[abi.OUTPUT_OWNERS] = '';
    parameters[abi.METADATA] = '';
    let offset = (abi.START_DATA + 1) * 32;
    const formattedProofData = encodeProofData(proofData);
    parameters[abi.PROOF_DATA] = padLeft(offset.toString(16), 64);
    offset += formattedProofData.length;
    const formattedInputSignatures = encodeInputSignatures(inputSignatures);
    parameters[abi.INPUT_SIGNATURES] = padLeft(offset.toString(16), 64);
    offset += formattedInputSignatures.length;
    const formattedOutputOwners = encodeOutputOwners(outputOwners);
    parameters[abi.OUTPUT_OWNERS] = padLeft(offset.toString(16), 64);
    offset += formattedOutputOwners.length;
    const formattedMetadata = encodeMetadata(metadata);
    parameters[abi.METADATA] = padLeft(offset.toString(16), 64);

    parameters.push(formattedProofData.data);
    parameters.push(formattedInputSignatures.data);
    parameters.push(formattedOutputOwners.data);
    parameters.push(formattedMetadata.data);
    return `0x${parameters.join('')}`;
};

module.exports = abiEncoder;

/*

function encode(proofData, m, challenge, inputSignatures, outputOwners, metadata) {
    const byteArray = [
        `0x${padLeft(Number(m).toString(16), 64)}`,
        padLeft(challenge.slice(2), 64),
        '',
        '',
        '',
        '',
    ];
    let currentOffset = 32 * 7;
    let noteString = padLeft(Number(proofData.length).toString(16), 64);
    noteString += proofData.reduce((acc, notes) => `${acc}${(notes.reduce((a, n) => `${a}${padLeft(n.slice(2), 64)}`, ''))}`, '');
    byteArray.push(noteString);
    byteArray[2] = padLeft(currentOffset.toString(16), 64);
    currentOffset += (noteString.length / 2);
    let signatureString = padLeft(inputSignatures.length.toString(16), 64);
    signatureString += inputSignatures
        .map(([v, r, s]) => `${padLeft(v.slice(2), 64)}${padLeft(r.slice(2), 64)}${padLeft(s.slice(2), 64)}`)
        .reduce((acc, s) => `${acc}${s}`, '');
    byteArray.push(signatureString);
    byteArray[3] = padLeft(currentOffset.toString(16), 64);
    currentOffset += (signatureString.length / 2);
    let ownersString = padLeft(outputOwners.length.toString(16), 64);
    ownersString += outputOwners.reduce((acc, o) => `${acc}${padLeft(o.slice(2), 64)}`, '');
    byteArray.push(ownersString);
    byteArray[4] = padLeft(currentOffset.toString(16), 64);
    currentOffset += (ownersString.length / 2);
    byteArray[5] = padLeft(currentOffset.toString(16), 64);
    currentOffset += (32 + (metadata.length * 32));

    const metadataBody = metadata.map(md => md.slice(2));
    const metadataPtr = metadataBody.reduce((acc, body) => [...acc, acc[acc.length - 1] + (body.length / 2)], [currentOffset]).slice(0, -1);
    const metadataArray = [
        padLeft(metadata.length.toString(16), 64),
        ...metadataPtr,
        ...metadataBody,
    ];
    byteArray.push(metadataArray.join(''));
    return byteArray.join('');
}
*/
