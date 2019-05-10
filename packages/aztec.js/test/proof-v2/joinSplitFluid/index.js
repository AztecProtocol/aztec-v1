const { constants, errors } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const { expect } = require('chai');
const { randomHex } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const { BurnProof, MintProof } = require('../../../src/proof-v2');
const note = require('../../../src/note');
const { validateElement, validateScalar } = require('../../helpers/bn128');

/**
 * There's a fair bit of duplication in this test suite, but the alternative is to use an API which is rather ugly
 * Essentially, the mint proof tests are logically on par with the burn proof tests.
 *
 * @see https://stackoverflow.com/questions/17144197/running-the-same-mocha-test-multiple-times-with-different-data
 */
describe.only('Join-Split Fluid Proof', () => {
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);

    describe('Mint Proof', () => {
        let currentMintCounter;
        let currentMintCounterNote;
        let mintedNotes;
        let mintedValues;
        let newMintCounter;
        let newMintCounterNote;

        before(() => {
            currentMintCounter = 30;
            newMintCounter = 50;
            mintedValues = [10, 10];
        });

        beforeEach(async () => {
            currentMintCounterNote = await note.create(publicKey, currentMintCounter);
            newMintCounterNote = await note.create(publicKey, newMintCounter);
            mintedNotes = await Promise.all(mintedValues.map((mintedValue) => note.create(publicKey, mintedValue)));
        });

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

        it('should fail to construct a Mint proof if point NOT on curve', async () => {
            newMintCounterNote.gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOT_ON_CURVE);
            }
        });

        it('should fail to construct a Mint proof if point at infinity', async () => {
            newMintCounterNote.gamma = newMintCounterNote.gamma.add(newMintCounterNote.gamma.neg());
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.POINT_AT_INFINITY);
            }
        });

        it('should fail to construct a Mint proof if viewing key response is 0', async () => {
            newMintCounterNote.a = new BN(0).toRed(bn128.groupReduction);
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.VIEWING_KEY_MALFORMED);
            }
        });

        it('should fail to construct a Mint proof if value > K_MAX', async () => {
            newMintCounterNote.k = new BN(constants.K_MAX + 1).toRed(bn128.groupReduction);
            try {
                const _ = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOTE_VALUE_TOO_BIG);
            }
        });
    });

    describe('Burn Proof', () => {
        let burnedValues;
        let burnedNotes;
        let currentBurnCounter;
        let currentBurnCounterNote;
        let newBurnCounter;
        let newBurnCounterNote;

        before(() => {
            currentBurnCounter = 30;
            newBurnCounter = 50;
            burnedValues = [10, 10];
        });

        beforeEach(async () => {
            currentBurnCounterNote = await note.create(publicKey, currentBurnCounter);
            newBurnCounterNote = await note.create(publicKey, newBurnCounter);
            burnedNotes = await Promise.all(burnedValues.map((burnedValue) => note.create(publicKey, burnedValue)));
        });

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

        it('should fail to construct a Burn proof if point NOT on curve', async () => {
            newBurnCounterNote.gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOT_ON_CURVE);
            }
        });

        it('should fail to construct a Burn proof if point at infinity', async () => {
            newBurnCounterNote.gamma = newBurnCounterNote.gamma.add(newBurnCounterNote.gamma.neg());
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.POINT_AT_INFINITY);
            }
        });

        it('should fail to construct a Burn proof if viewing key response is 0', async () => {
            newBurnCounterNote.a = new BN(0).toRed(bn128.groupReduction);
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.VIEWING_KEY_MALFORMED);
            }
        });

        it('should fail to construct a Burn proof if value > K_MAX', async () => {
            newBurnCounterNote.k = new BN(constants.K_MAX + 1).toRed(bn128.groupReduction);
            try {
                const _ = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            } catch (err) {
                expect(err.message).to.contain(errors.codes.NOTE_VALUE_TOO_BIG);
            }
        });
    });
});
