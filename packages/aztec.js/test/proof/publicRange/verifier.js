import * as bn128 from '@aztec/bn128';
import { errors } from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import BN from 'bn.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { padLeft, randomHex } from 'web3-utils';
import * as note from '../../../src/note';
import { PublicRangeProof , Proof } from '../../../src/proof';
import PublicRangeVerifier from '../../../src/proof/proofs/UTILITY/epoch0/publicRange/verifier';


describe('Public range proof verifier', () => {
    let originalNote = {};
    const originalNoteValue = 50;
    let utilityNote = {};
    const utilityNoteValue = 40;
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);
    const publicComparison = 10;

    const isGreaterOrEqual = true;

    before(async () => {
        originalNote = await note.create(publicKey, originalNoteValue);
        utilityNote = await note.create(publicKey, utilityNoteValue);
    });
    describe('Success States', () => {
        it('should verify a valid Swap proof', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(verifier.errors.length).to.equal(0);
        });
    });

    describe('Failure states', () => {
        let validateInputsStub;
        before(() => {
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
        });

        after(() => {
            validateInputsStub.restore();
        });

        it('should fail for unsatisfied proof relations', async () => {
            const bogusTargetNoteValue = 41;
            const bogusUtilityNote = await note.create(publicKey, bogusTargetNoteValue);
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, bogusUtilityNote, false);

            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail for fake challenge', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            proof.challenge = new BN(randomHex(31), 16);

            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail for fake proof data', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            proof.data = [];
            for (let i = 0; i < 3; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.contain(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if points NOT on curve', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            proof.data[0][2] = padLeft('0x00', 64);

            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factor at infinity', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN(10).toRed(bn128.groupReduction);

            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factor computed from invalid point', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            proof.data[0][0] = `0x${padLeft('', 64)}`;
            proof.data[0][1] = `0x${padLeft('', 64)}`;
            proof.data[0][2] = `0x${padLeft('', 64)}`;
            proof.data[0][3] = `0x${padLeft('', 64)}`;
            proof.data[0][4] = `0x${padLeft('', 64)}`;
            proof.data[0][5] = `0x${padLeft('', 64)}`;

            const verifier = new PublicRangeVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(6);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[2]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[3]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[4]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[5]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
