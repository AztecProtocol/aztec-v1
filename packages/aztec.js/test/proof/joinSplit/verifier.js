/* eslint-disable prefer-arrow-callback */
import * as bn128 from '@aztec/bn128';

import { errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import { expect } from 'chai';
import sinon from 'sinon';
import { padLeft, randomHex } from 'web3-utils';
import { balancedPublicValues, mockNoteSet, randomNoteValue } from '../../helpers/note';
import { JoinSplitProof, Proof } from '../../../src/proof';
import JoinSplitVerifier from '../../../src/proof/proofs/BALANCED/epoch0/joinSplit/verifier';
import { mockZeroJoinSplitProof } from '../../helpers/proof';
import ProofUtils from '../../../src/proof/base/epoch0/utils';

describe('Join-Split Proof Verifier', () => {
    const sender = randomHex(20);
    const publicOwner = randomHex(20);

    describe('Success States', () => {
        it('should verify a valid Join-Split proof', async () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const publicValue = -10;
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should verify a Join-Split proof with 0 input notes', async () => {
            const kIn = [];
            const kOut = Array(5)
                .fill()
                .map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should verify a Join-Split proof with 0 output notes', async () => {
            const kIn = Array(5)
                .fill()
                .map(() => randomNoteValue());
            const kOut = [];
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas).to.equal(undefined);
            expect(result.pairingSigmas).to.equal(undefined);
        });

        it('should verify a Join-Split proof with large numbers of notes', async () => {
            const kIn = Array(20)
                .fill()
                .map(() => randomNoteValue());
            const kOut = Array(20)
                .fill()
                .map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should verify a Join-Split proof with uneven number of notes', async () => {
            const { kIn, kOut } = balancedPublicValues(20, 3);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should verify a Join-Split proof with public value = 0', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });
    });

    describe('Failure States', () => {
        let validateInputsStub;

        beforeEach(() => {
            // To test failure states we need to pass in bad data to verifier, so we need
            // to turn off Proof.validateInputs
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {
                return {};
            });
        });

        afterEach(() => {
            validateInputsStub.restore();
        });

        it('should fail if notes do NOT balance', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            kIn.push(1);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if public value > group modulus', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            kIn.push(100);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const publicValue = bn128.curve.n.add(new BN(100));
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_TOO_BIG);
        });

        it('should fail if malformed proof data', async () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const publicValue = -10;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if points NOT on curve', () => {
            // We can construct 'proof' where all points and scalars are zero. The challenge response
            // will be correctly reconstructed, but the proof should still be invalid
            const zeroProof = mockZeroJoinSplitProof();

            const verifier = new JoinSplitVerifier(zeroProof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(4);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[2]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[3]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
        });

        it('should fail if scalars are zero', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.data[0][0] = padLeft('0x00', 64);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        // TODO: hasn't this exact same behaviour been tested above...?
        it('should fail if blinding factors computed from invalid point', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.data[0][0] = padLeft('0x00', 64);
            proof.data[0][1] = padLeft('0x00', 64);
            proof.data[0][2] = padLeft('0x00', 64);
            proof.data[0][3] = padLeft('0x00', 64);
            proof.data[0][4] = padLeft('0x00', 64);
            proof.data[0][5] = padLeft('0x00', 64);
            proof.challenge = new BN(0);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(8);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[2]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[3]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[4]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[5]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[6]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[7]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should fail if malformed challenge', async () => {
            const kIn = Array(5)
                .fill()
                .map(() => randomNoteValue());
            const kOut = Array(5)
                .fill()
                .map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.challenge = new BN(randomHex(31), 16);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
