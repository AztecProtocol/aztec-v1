const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, toHex } = require('web3-utils');

const bn128 = require('../../src/bn128');
const note = require('../../src/note');

const mockLightNote = async (k) => {
    const a = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.curve.n).toString(16), 64);
    const kHex = padLeft(toHex(Number(k).toString(10)).slice(2), 8);
    const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
    const viewingKey = `0x${a}${kHex}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
    return note.fromViewKey(viewingKey);
};

/**
 * Constructs a mock note directly from the setup algorithm's trapdoor key.
 * Used for testing purposes only; we don't know the trapdoor key for the real deal.
 */
const mockNote = async (k, trapdoor) => {
    const lightNote = await mockLightNote(k);
    const kBn = new BN(k).toRed(bn128.groupReduction);
    const mu = bn128.h.mul(trapdoor.redSub(kBn).redInvm());
    const gamma = mu.mul(lightNote.a);
    const sigma = gamma.mul(kBn).add(bn128.h.mul(lightNote.a));
    return {
        ...lightNote,
        gamma,
        sigma,
    };
};

/**
 * Create a set of mock light notes from vectors of input and output values
 *
 * @method mockLightNoteSet
 * @param {Object} values
 * @param {number[]} values.kIn vector of input note values
 * @param {number[]} values.kOut vector of output note values
 * @returns {Object} input notes and output notes
 */
const mockLightNoteSet = async ({ kIn, kOut }) => {
    const inputNotes = await Promise.all(
        kIn.map((k) => {
            return mockLightNote(k);
        }),
    );
    const outputNotes = await Promise.all(
        kOut.map((k) => {
            return mockLightNote(k);
        }),
    );
    return { inputNotes, outputNotes };
};

/**
 * Create a set of mock notes from vectors of input and output values.
 * This method uses a randomly generated trapdoor key instead of the trusted setup key.
 *
 * @method mockNoteSet
 * @param {Object} values
 * @param {number[]} values.kIn vector of input note values
 * @param {number[]} values.kOut vector of output note values
 * @returns {Object} input notes, output notes and trapdoor function
 */
const mockNoteSet = async ({ kIn, kOut }) => {
    const trapdoor = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
    const inputNotes = await Promise.all(
        kIn.map((k) => {
            return mockNote(k, trapdoor);
        }),
    );
    const outputNotes = await Promise.all(
        kOut.map((k) => {
            return mockNote(k, trapdoor);
        }),
    );
    return { inputNotes, outputNotes, trapdoor };
};

module.exports = {
    mockLightNoteSet,
    mockNoteSet,
};
