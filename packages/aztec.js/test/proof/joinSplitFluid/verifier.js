import { errors } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import sinon from 'sinon';
import { BurnProof, MintProof, Proof } from '../../../src/proof';
import BurnVerifier from '../../../src/proof/proofs/BURN/epoch0/burn/verifier';
import MintVerifier from '../../../src/proof/proofs/MINT/epoch0/mint/verifier';
import note from '../../../src/note';

describe('Join-Split Fluid Proof Verifier', () => {
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);

    describe('Mint Proof Verifier', () => {
        let currentMintCounter;
        let currentMintCounterNote;
        let mintedNotes;
        let mintedNoteValues;
        let newMintCounter;
        let newMintCounterNote;

        before(() => {
            currentMintCounter = 30;
            newMintCounter = 50;
            mintedNoteValues = [10, 10];
        });

        beforeEach(async () => {
            currentMintCounterNote = await note.create(publicKey, currentMintCounter);
            newMintCounterNote = await note.create(publicKey, newMintCounter);
            mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
        });

        describe('Success States', () => {
            it('should verify a valid Mint proof', async () => {
                const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
                const verifier = new MintVerifier(proof);
                const _ = verifier.verifyProof();
                expect(verifier.isValid).to.equal(true);
            });
        });

        describe('Failure States', () => {
            it('should fail if number of notes supplied is less than 2', async () => {
                const validateInputs = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
                const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);

                proof.data = [proof.data[0]];

                const verifier = new MintVerifier(proof);
                const _ = verifier.verifyProof();
                expect(verifier.isValid).to.equal(false);
                expect(verifier.errors.length).to.equal(3);
                expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
                expect(verifier.errors[1]).to.equal(errors.codes.INCORRECT_NOTE_NUMBER);
                expect(verifier.errors[2]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
                validateInputs.restore();
            });
        });
    });

    describe('Burn Proof Verifier', () => {
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

        describe('Success States', () => {
            it('should verify a valid Burn proof', async () => {
                const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
                const verifier = new BurnVerifier(proof);

                const _ = verifier.verifyProof();
                expect(verifier.isValid).to.equal(true);
            });
        });

        describe('Failure States', () => {
            it('should fail if number of notes supplied is less than 2', async () => {
                const validateInputs = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
                const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);

                proof.data = [proof.data[0]];

                const verifier = new BurnVerifier(proof);
                const _ = verifier.verifyProof();
                expect(verifier.isValid).to.equal(false);
                expect(verifier.errors.length).to.equal(3);
                expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
                expect(verifier.errors[1]).to.equal(errors.codes.INCORRECT_NOTE_NUMBER);
                expect(verifier.errors[2]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
                validateInputs.restore();
            });
        });
    });
});
