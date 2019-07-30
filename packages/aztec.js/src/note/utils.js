/**
 * Note utility functions
 *
 * @module module:note.utils
 */

const secp256k1 = require('@aztec/secp256k1');
const crypto = require('crypto');
const { keccak256, padLeft } = require('web3-utils');

const utils = {};

utils.constants = {
    ZERO_VALUE_NOTE_VIEWING_KEY:
        // eslint-disable-next-line max-len
        '0x00000000000000000000000000000000000000000000000000000000000000010000000002eff9beac9595f45cf86e1d9864f1d3d9460b77a74cb6fbcbd796fd877ef34b34',
};

/**
 * Create a Diffie-Hellman shared secret for a given public key
 *
 * @method createSharedSecret
 * @private
 * @param {Object} pubicKeyHex elliptic.js hex-formatted public key
 * @return {{type: string, name: ephemeralKey}} elliptic.js hex-formatted ephemeral key
 * @return {{type: string, name: encoded}} hex-string formatted shared secret
 */
utils.createSharedSecret = (publicKeyHex) => {
    const publicKey = secp256k1.ec.keyFromPublic(publicKeyHex.slice(2), 'hex');
    // When on the web crypto comes from a dependency which acts as a wrapper for browser-level entropy. The version should be fixed to make sure randomness is maintained.
    const ephemeralKey = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
    const sharedSecret = publicKey.getPublic().mul(ephemeralKey.priv);
    const sharedSecretHex = `0x${sharedSecret.encode(false).toString('hex')}`;
    const encoded = keccak256(sharedSecretHex, 'hex');
    return {
        ephemeralKey: `0x${ephemeralKey.getPublic(true, 'hex')}`,
        encoded,
    };
};

/**
 * Get the hash of a note's coordinates. Used as identifier in note registry
 *
 * @method getNoteHash
 * @private
 * @param {Object} gamma AZTEC commitment base point
 * @param {Object} sigma AZTEC commitment signed point
 * @returns {string} keccak256 hash in hex-string format
 */
utils.getNoteHash = (gamma, sigma) => {
    const noteType = padLeft('1', 64);
    const gammaX = padLeft(gamma.x.fromRed().toString(16), 64);
    const gammaY = padLeft(gamma.y.fromRed().toString(16), 64);
    const sigmaX = padLeft(sigma.x.fromRed().toString(16), 64);
    const sigmaY = padLeft(sigma.y.fromRed().toString(16), 64);
    return keccak256(`0x${noteType}${gammaX}${gammaY}${sigmaX}${sigmaY}`, 'hex');
};

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
    return keccak256(sharedSecretHex, 'hex');
};

module.exports = utils;
