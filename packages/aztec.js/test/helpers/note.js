import * as bn128 from '@aztec/bn128';
import { constants } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import crypto from 'crypto';
import { padLeft, toHex } from 'web3-utils';
import note from '../../src/note';
import ProofUtils from '../../src/proof/base/epoch0/utils';

const mockLightNote = async (k) => {
    const a = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.curve.n).toString(16), 64);
    const kHex = padLeft(toHex(Number(k).toString(10)).slice(2), 8);
    const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
    const viewingKey = `0x${a}${kHex}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
    return note.fromViewKey(viewingKey);
};

/**
 * Construct a mock note directly from the setup algorithm's trapdoor key.
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
 * @param {number[]} kIn vector of input note values
 * @param {number[]} kOut vector of output note values
 * @returns {Object} input notes and output notes
 */
const mockLightNoteSet = async (kIn, kOut) => {
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
 * @param {number[]} kIn vector of input note values
 * @param {number[]} kOut vector of output note values
 * @returns {Object} input notes, output notes and trapdoor function
 */
const mockNoteSet = async (kIn, kOut) => {
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

/**
 * Generate a random note value that is less than K_MAX
 *
 * @method randomNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
const randomNoteValue = () => {
    return Math.floor(Math.random() * constants.K_MAX);
};

/**
 * Generate a set of random input and output values based on the number of notes.
 *
 * @param {number} nIn number of input notes
 * @param {number} nOut number of output notes
 */
const balancedPublicValues = (nIn, nOut) => {
    const kIn = Array(nIn)
        .fill()
        .map(() => randomNoteValue());
    const kOut = Array(nOut)
        .fill()
        .map(() => randomNoteValue());
    let delta = ProofUtils.getPublicValue(kIn, kOut);
    while (delta > 0) {
        if (delta >= constants.K_MAX) {
            const k = randomNoteValue();
            kOut.push(k);
            delta -= k;
        } else {
            kOut.push(delta);
            delta = 0;
        }
    }
    while (delta < 0) {
        if (-delta >= constants.K_MAX) {
            const k = randomNoteValue();
            kIn.push(k);
            delta += k;
        } else {
            kIn.push(-delta);
            delta = 0;
        }
    }
    return { kIn, kOut };
};

export {
    balancedPublicValues,
    mockLightNoteSet,
    mockNoteSet,
    randomNoteValue,
};
