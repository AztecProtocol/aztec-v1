import * as bn128 from '@aztec/bn128';
import { errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { padLeft, padRight, randomHex } from 'web3-utils';
import { mockNoteSet, randomNoteValue } from '../../helpers/note';
import { mockZeroSwapProof } from '../../helpers/proof';
import { Proof, SwapProof } from '../../../src/proof';
import SwapVerifier from '../../../src/proof/proofs/BALANCED/epoch0/swap/verifier';

describe('Swap Proof Verifier', () => {
    const sender = randomHex(20);

    describe('Success States', () => {
        it('should verify a valid Swap proof', async () => {
            const kIn = [10, 20];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(verifier.errors.length).to.equal(0);
        });
    });

    describe('Failure States', () => {
        let validateInputsStub;

        before(() => {
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
        });

        after(() => {
            validateInputsStub.restore();
        });

        it('should fail if notes do NOT balance ((k1 != k3, k2 != k4)', async () => {
            const kIn = [10, 19];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if random note values', async () => {
            const kIn = Array(2)
                .fill()
                .map(() => randomNoteValue());
            const kOut = Array(2)
                .fill()
                .map(() => randomNoteValue());
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if malformed proof data', async () => {
            const kIn = [10, 20];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors).to.contain(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const kIn = [10, 20];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);

            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factors computed from scalars that are zero', async () => {
            const kIn = [10, 20];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);

            proof.data[0][0] = padLeft('0x00', 64); // kBar
            proof.data[0][1] = padLeft('0x00', 64); // aBar

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(3);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[2]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factors computed from points NOT on curve', async () => {
            // We can construct 'proof' where all points and scalars are zero. The challenge response
            // is correctly reconstructed, but the proof should still be invalid
            const zeroProof = mockZeroSwapProof();
            // Make the kBars satisfy the proof relation, to ensure it's not an incorrect balancing
            // relationship that causes the test to fail
            zeroProof.data[0][0] = padRight('0x10', 64); // k_1
            zeroProof.data[1][0] = padRight('0x20', 64); // k_2
            zeroProof.data[2][0] = padRight('0x10', 64); // k_3
            zeroProof.data[3][0] = padRight('0x20', 64); // k_4
            // Set aBars to arbitrarily chosen values, to ensure it's not failing due to aBar = 0
            zeroProof.data[0][1] = padRight('0x40', 64); // a_1
            zeroProof.data[1][1] = padRight('0x50', 64); // a_2
            zeroProof.data[2][1] = padRight('0x60', 64); // a_3
            zeroProof.data[3][1] = padRight('0x70', 64); // a_4

            const verifier = new SwapVerifier(zeroProof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(13);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_TOO_BIG);
            expect(verifier.errors[1]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[2]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[3]).to.equal(errors.codes.SCALAR_TOO_BIG);
            expect(verifier.errors[4]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[5]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[6]).to.equal(errors.codes.SCALAR_TOO_BIG);
            expect(verifier.errors[7]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[8]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[9]).to.equal(errors.codes.SCALAR_TOO_BIG);
            expect(verifier.errors[10]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[11]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[12]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if malformed challenge', async () => {
            const kIn = [10, 20];
            const kOut = [10, 20];
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.challenge = new BN(randomHex(31).slice(2), 16);

            const verifier = new SwapVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
