import * as bn128 from '@aztec/bn128';
import { constants, errors } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import { BurnProof, MintProof } from '../../../src/proof';
import * as note from '../../../src/note';
import { validateElement, validateScalar } from '../../helpers/bn128';

const { publicKey } = secp256k1.generateAccount();
const sender = randomHex(20);

/**
 * The mint proof tests are logically on par with the burn proof tests, which means there's a fair bit of
 * duplication in this test suite. Unfortunately, the alternative is to use an API which is rather ugly.
 *
 * @see https://stackoverflow.com/questions/17144197/running-the-same-mocha-test-multiple-times-with-different-data
 */
describe('Mint Proof', () => {
    const currentMintCounter = 30;
    let currentMintCounterNote;
    let mintedNotes;
    const mintedNoteValues = [10, 10];
    const newMintCounter = 50;
    let newMintCounterNote;

    beforeEach(async () => {
        currentMintCounterNote = await note.create(publicKey, currentMintCounter);
        newMintCounterNote = await note.create(publicKey, newMintCounter);
        mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
    });

    describe('Success States', () => {
        it('should construct a Mint proof with well-formed outputs', async () => {
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);

            expect(proof.data.length).to.equal(4);
            expect(proof.challengeHex.length).to.equal(66);
            validateScalar(proof.challengeHex);

            const dataLength = proof.data.length;
            proof.data.forEach((testNote, i) => {
                validateScalar(testNote[0], i === dataLength - 1);
                validateScalar(testNote[1]);
                validateElement(testNote[2], testNote[3]);
                validateElement(testNote[4], testNote[5]);
            });
        });
    });

    describe('Failure States', () => {
        it('should fail if value > K_MAX', async () => {
            newMintCounterNote.k = new BN(constants.K_MAX + 1).toRed(bn128.groupReduction);
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOTE_VALUE_TOO_BIG);
            }
        });

        it('should fail if gamma NOT on curve', async () => {
            newMintCounterNote.gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOT_ON_CURVE);
            }
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            newMintCounterNote.gamma = newMintCounterNote.gamma.add(newMintCounterNote.gamma.neg());
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.POINT_AT_INFINITY);
            }
        });

        it('should fail if malformed viewing key', async () => {
            newMintCounterNote.a = bn128.zeroBnRed;
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.VIEWING_KEY_MALFORMED);
            }
        });
    });
});

describe('Burn Proof', () => {
    const burnedNoteValues = [10, 10];
    let burnedNotes;
    const currentBurnCounter = 30;
    let currentBurnCounterNote;
    const newBurnCounter = 50;
    let newBurnCounterNote;

    beforeEach(async () => {
        currentBurnCounterNote = await note.create(publicKey, currentBurnCounter);
        newBurnCounterNote = await note.create(publicKey, newBurnCounter);
        burnedNotes = await Promise.all(burnedNoteValues.map((burnedValue) => note.create(publicKey, burnedValue)));
    });

    describe('Success States', () => {
        it('should construct a Burn proof with well-formed outputs', async () => {
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);

            expect(proof.data.length).to.equal(4);
            expect(proof.challengeHex.length).to.equal(66);
            validateScalar(proof.challengeHex);

            const dataLength = proof.data.length;
            proof.data.forEach((testNote, i) => {
                validateScalar(testNote[0], i === dataLength - 1);
                validateScalar(testNote[1]);
                validateElement(testNote[2], testNote[3]);
                validateElement(testNote[4], testNote[5]);
            });
        });
    });

    describe('Failure States', () => {
        it('should fail if value > K_MAX', async () => {
            newBurnCounterNote.k = new BN(constants.K_MAX + 1).toRed(bn128.groupReduction);
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOTE_VALUE_TOO_BIG);
            }
        });

        it('should fail if gamma NOT on curve', async () => {
            newBurnCounterNote.gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOT_ON_CURVE);
            }
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            newBurnCounterNote.gamma = newBurnCounterNote.gamma.add(newBurnCounterNote.gamma.neg());
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.POINT_AT_INFINITY);
            }
        });

        it('should fail if malformed viewing key', async () => {
            newBurnCounterNote.a = bn128.zeroBnRed;
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.VIEWING_KEY_MALFORMED);
            }
        });
    });
});
