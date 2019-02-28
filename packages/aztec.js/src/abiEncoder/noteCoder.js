const { padLeft } = require('web3-utils');

const bn128 = require('../bn128');
const secp256k1 = require('../secp256k1');

const noteCoder = {};

noteCoder.encodeNotePublicKey = ({ gamma, sigma, ephemeral }) => {
    const gammaEnc = gamma.encode('hex', true);
    const sigmaEnc = sigma.encode('hex', true);
    const ephemeralEnc = ephemeral.encode('hex', true);
    return `0x${padLeft(gammaEnc, 66)}${padLeft(sigmaEnc, 66)}${padLeft(ephemeralEnc, 66)}`;
};

noteCoder.decodeNoteFromEventLog = (parameter) => {
    if (parameter.length !== 196) {
        throw new Error('event parameter has incorrect length!');
    }
    const gammaCompressed = parameter.slice(0x02, 0x42);
    const sigmaCompressed = parameter.slice(0x42, 0x82);
    const ephemeralCompressed = parameter.slice(0x82, 0x1c4);
    const gamma = bn128.decompressHex(gammaCompressed);
    const sigma = bn128.decompressHex(sigmaCompressed);
    const ephemeral = secp256k1.decompressHex(ephemeralCompressed);
    return noteCoder.encodeNotePublicKey({ gamma, sigma, ephemeral });
};

module.exports = noteCoder;
