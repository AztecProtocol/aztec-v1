
const { padLeft } = require('web3-utils');
const secp256k1 = require('../secp256k1');


const encoderFactory = {};

encoderFactory.encodeNote = (notes) => {
    return notes.map(note => padLeft(note.slice(2), 64)).join('');
};

encoderFactory.encodeProofData = (proofData) => {
    const { length } = proofData;
    const noteString = proofData.map(notes => encoderFactory.encodeNote(notes));
    const data = [padLeft(Number(length).toString(16), 64), ...noteString].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

encoderFactory.encodeInputOwners = (inputOwners) => {
    const { length } = inputOwners;
    const ownerStrings = inputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};


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

encoderFactory.encodeOutputOwners = (outputOwners) => {
    const { length } = outputOwners;
    const ownerStrings = outputOwners.map(o => padLeft(o.slice(2), 64));
    const data = [padLeft(Number(length).toString(16), 64), ...ownerStrings].join('');
    return {
        data,
        length: Number(data.length / 2),
    };
};

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
