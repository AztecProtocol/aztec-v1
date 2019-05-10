/* eslint-disable prefer-arrow-callback */
const { errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { expect } = require('chai');
const sinon = require('sinon');
const { padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const { JoinSplitProof } = require('../../../src/proof-v2');
const JoinSplitVerifier = require('../../../src/proof-v2/joinSplit/verifier');
const { mockNoteSet, randomNoteValue, randomPublicValues } = require('../../helpers/note');
const { mockZeroJoinSplitProof } = require('../../helpers/proof');
const { Proof } = require('../../../src/proof-v2/proof');
const ProofUtils = require('../../../src/proof-v2/utils');

describe.only('Join-Split Proof Verifier', () => {
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

        it('should accept a Join-Split proof with 0 input notes', async () => {
            const kIn = [];
            const kOut = [...Array(5)].map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should accept a Join-Split proof with 0 output notes', async () => {
            const kIn = [...Array(5)].map(() => randomNoteValue());
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

        it('should accept a Join-Split proof with large numbers of notes', async () => {
            const kIn = [...Array(20)].map(() => randomNoteValue());
            const kOut = [...Array(20)].map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should accept a Join-Split proof with uneven number of notes', async () => {
            const { kIn, kOut } = randomPublicValues(20, 3);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
        });

        it('should accept a Join-Split proof with kPublic = 0', async () => {
            const { kIn, kOut } = randomPublicValues(5, 10);
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
            // to test failure states we need to pass in bad data to verifier
            // so we need to turn off Proof.validateInputs
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {
                return {};
            });
        });

        afterEach(() => {
            validateInputsStub.restore();
        });

        it('should REJECT if points NOT on curve', () => {
            // we can construct 'proof' where all points and scalars are zero.
            // The challenge response will be correctly reconstructed, but the proof should still be invalid
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

        it.skip('should REJECT for notes that do NOT balance', async () => {
            const { kIn, kOut } = randomPublicValues(5, 10);
            kIn.push(1);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT for malformed challenge', async () => {
            const kIn = [...Array(5)].map(() => randomNoteValue());
            const kOut = [...Array(5)].map(() => randomNoteValue());
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const bogusChallengeHex = randomHex(31);
            sinon.stub(proof, 'challengeHex').get(() => bogusChallengeHex);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT for malformed proof data', async () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const publicValue = -10;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const bogusProofData = [...Array(4)].map(() => [...Array(6)].map(() => `0x${padLeft(randomHex(32), 64)}`));
            sinon.stub(proof, 'data').value(bogusProofData);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if publicValue > group modulus', async () => {
            const { kIn, kOut } = randomPublicValues(5, 10);
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

        it('should REJECT if note value response is 0', async () => {
            const { kIn, kOut } = randomPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const bogusProofData = proof.data;
            bogusProofData[0][0] = '0x';
            sinon.stub(proof, 'data').value(bogusProofData);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if blinding factor is at infinity', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const bogusProofData = proof.data;
            bogusProofData[0][0] = `0x${padLeft('05', 64)}`;
            bogusProofData[0][1] = `0x${padLeft('05', 64)}`;
            bogusProofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            bogusProofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            bogusProofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            bogusProofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            sinon.stub(proof, 'data').value(bogusProofData);

            const bogusChallengeHex = `0x${padLeft('0a', 64)}`;
            sinon.stub(proof, 'challengeHex').get(() => bogusChallengeHex);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if blinding factor computed from invalid point', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const bogusProofData = proof.data;
            bogusProofData[0][0] = `0x${padLeft('', 64)}`;
            bogusProofData[0][1] = `0x${padLeft('', 64)}`;
            bogusProofData[0][2] = `0x${padLeft('', 64)}`;
            bogusProofData[0][3] = `0x${padLeft('', 64)}`;
            bogusProofData[0][4] = `0x${padLeft('', 64)}`;
            bogusProofData[0][5] = `0x${padLeft('', 64)}`;
            sinon.stub(proof, 'data').value(bogusProofData);

            const bogusChallengeHex = `0x${padLeft('', 64)}`;
            sinon.stub(proof, 'challengeHex').get(() => bogusChallengeHex);

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
    });
});
