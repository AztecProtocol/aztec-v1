/* eslint-disable */

/**
 * Note utility functions
 *
 * @module module:noteUtils
 */
const { padLeft, sha3 } = require('web3-utils');

const utils = {};

/**
 * Compute a Diffie-Hellman shared secret between an ephemeral point and a private key
 *
 * @method getSharedSecret
 * @private
 * @param {Object} ephemeralPoint secp256k1 point
 * @param {Object} privateKey hex-string formatted private key
 * @returns {string} hex-string formatted shared secret
 */
utils.getSharedSecret = (ephemeralPoint, privateKey) => {
    const sharedSecret = ephemeralPoint.mul(Buffer.from(privateKey.slice(2), 'hex'));
    const sharedSecretHex = `0x${sharedSecret.encode(false).toString('hex')}`;
    return sha3(sharedSecretHex, 'hex');
};

/**
 * Get the hash of a note's coordinates. Used as identifier in note registry
 *
 * @method getNoteHash
 * @private
 * @param {Object} gamma AZTEC commitment base point
 * @param {Object} sigma AZTEC commitment signed point
 * @returns {string} sha3 hash in hex-string format
 */
utils.getNoteHash = (gamma, sigma) => {
    const noteType = padLeft('1', 64);
    const gammaX = padLeft(gamma.x.fromRed().toString(16), 64);
    const gammaY = padLeft(gamma.y.fromRed().toString(16), 64);
    const sigmaX = padLeft(sigma.x.fromRed().toString(16), 64);
    const sigmaY = padLeft(sigma.y.fromRed().toString(16), 64);
    return sha3(`0x${noteType}${gammaX}${gammaY}${sigmaX}${sigmaY}`, 'hex');
};

utils.constants = {
    ZERO_VALUE_NOTE_VIEWING_KEY: '0x00000000000000000000000000000000000000000000000000000000000000010000000002eff9beac9595f45cf86e1d9864f1d3d9460b77a74cb6fbcbd796fd877ef34b34',
};

module.exports = utils;
