import * as bn128 from '@aztec/bn128';
import { constants } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import crypto from 'crypto';
import { padLeft, toHex } from 'web3-utils';
import * as note from '../../src/note';

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

function kMaxBoundValue(value) {
    if (process.env.NODE_ENV === 'TEST' || process.env.NODE_ENV === 'development') {
        return value > constants.K_MAX_TEST ? constants.K_MAX_TEST : value;
    }

    return value > constants.K_MAX ? constants.K_MAX : value;
}

/**
 * Generate a random note value that is less than K_MAX
 *
 * @method randomNoteValue
 * @param {number} maxValue max value of random note
 * @returns {BN} - big number instance of an AZTEC note value
 */
const randomNoteValue = (maxValue = constants.K_MAX) => {
    return Math.floor(Math.random() * kMaxBoundValue(maxValue));
};

/**
 * Generate a set of notes with a defined total value
 *
 * @method noteSetOfValue
 * @param {number} numberOfNotes number of notes
 * @param {number} totalValue sum of notes
 * @returns {Array} - Array of notes
 */
const noteSetOfValue = (numberOfNotes, totalValue) => {
    const averageValue = Math.floor(kMaxBoundValue(totalValue) / numberOfNotes);
    const notes = [];
    for (let i = 0; i < numberOfNotes; i += 1) {
        if (i === numberOfNotes - 1) {
            notes[i] = totalValue - averageValue * i;
        } else {
            notes[i] = averageValue;
        }
    }
    return notes;
};

/**
 * Generate a set of random input and output values based on the number of notes.
 *
 * @param {number} nIn number of input notes
 * @param {number} nOut number of output notes
 */
const balancedPublicValues = (nIn, nOut) => {
    const transactionAmount = randomNoteValue();
    const kIn = noteSetOfValue(nIn, transactionAmount);
    const kOut = noteSetOfValue(nOut, transactionAmount);

    return { kIn, kOut };
};

/**
 * Dummy account used to test the granting of note view access
 */
const userAccount = {
    address: '0xfB95acC8D3870da3C646Ae8c3C621916De8DF42d',
    linkedPublicKey: '0xa61d17b0dd3095664d264628a6b947721314b6999aa6a73d3c7698f041f78a4d',
    linkedPrivateKey: 'e1ec35b90155a633ac75d0508e537a7e00fd908a5295365054001a44b4a0560c',
    spendingPublicKey: '0x0290e0354caa04c73920339f979cfc932dd3d52ba8210fec34571bb6422930c396',
};

/**
 * Second dummy account used to test the granting of note view access
 */
const userAccount2 = {
    address: '0x61EeAd169ec67b24abee7B81Ca750b6dCA3a9CCd',
    linkedPublicKey: '0x058d55269a83b5ea379931ac58bc3def375eab12e527708111545af46f5f9b5c',
    linkedPrivateKey: '6a30cc7b28b037b47378522a1a370c2394b0dd2d70c6abbe5ac66c8a1d84db21',
    spendingPublicKey: '0x02090a6b89b0588626f26babc87f2dc1e2c815b8248754bed93d837f7071411605',
};

export { balancedPublicValues, mockLightNoteSet, mockNoteSet, randomNoteValue, userAccount, userAccount2 };
