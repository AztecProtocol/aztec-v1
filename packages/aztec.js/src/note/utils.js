/**
 * Note utility functions
 *
 * @module module:note.utils
 */

import secp256k1 from '@aztec/secp256k1';

import crypto from 'crypto';
import { keccak256, padLeft } from 'web3-utils';

const utils = {};

utils.constants = {
    ZERO_VALUE_NOTE_VIEWING_KEY:
        // eslint-disable-next-line max-len
        '0x00000000000000000000000000000000000000000000000000000000000000010000000002eff9beac9595f45cf86e1d9864f1d3d9460b77a74cb6fbcbd796fd877ef34b34',
};

utils.customMetaData =
    // eslint-disable-next-line max-len
    '0x00000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';

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
    // When on the web crypto comes from a dependency which acts as a wrapper for browser-level entropy.
    // The version should be fixed to make sure randomness is maintained.
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

utils.randomCustomMetaData = () => {
    const integer = Math.floor(Math.random() * 10);

    const arrayMetaData = utils.customMetaData.split('');
    arrayMetaData[30] = integer;
    return arrayMetaData.join('');
};

export default utils;
