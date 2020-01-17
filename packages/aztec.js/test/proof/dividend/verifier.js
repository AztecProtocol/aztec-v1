import * as bn128 from '@aztec/bn128';
import { constants, errors } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { expect } from 'chai';
import { padLeft, randomHex } from 'web3-utils';
import sinon from 'sinon';
import { DividendProof , Proof } from '../../../src/proof';
import DividendVerifier from '../../../src/proof/proofs/UTILITY/epoch0/dividend/verifier';
import * as note from '../../../src/note';


describe('Dividend Proof Verifier', () => {
    let notionalNote = {};
    const notionalNoteValue = 90;
    const { publicKey } = secp256k1.generateAccount();
    let residualNote = {};
    const residualNoteValue = 4;
    const sender = randomHex(20);
    let targetNote = {};
    const targetNoteValue = 50;

    before(async () => {
        notionalNote = await note.create(publicKey, notionalNoteValue);
        targetNote = await note.create(publicKey, targetNoteValue);
        residualNote = await note.create(publicKey, residualNoteValue);
    });

    describe('Success States', () => {
        it('should verify a valid Dividend proof', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
        });
    });

    describe('Success States', () => {
        let validateInputsStub;

        before(() => {
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
        });

        after(() => {
            validateInputsStub.restore();
        });

        it('should fail if unsatisfied proof relations', async () => {
            const za = 100;
            const zb = 5;
            const bogusTargetNoteValue = 49;
            const bogusTargetNote = await note.create(publicKey, bogusTargetNoteValue);
            const proof = new DividendProof(notionalNote, residualNote, bogusTargetNote, sender, za, zb);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if z_a > K_MAX', async () => {
            const za = constants.K_MAX + 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.ZA_TOO_BIG);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if z_b > k_max', async () => {
            const za = 100;
            const zb = constants.K_MAX + 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.ZB_TOO_BIG);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if malformed proof data', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [];
            for (let i = 0; i < 3; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.contain(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if points NOT on curve', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Set the x coordinate of gamma to zero
            proof.data[0][2] = padLeft('0x00', 64);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if malformed challenge', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = new BN(1).toRed(bn128.groupReduction);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN(10).toRed(bn128.groupReduction);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
