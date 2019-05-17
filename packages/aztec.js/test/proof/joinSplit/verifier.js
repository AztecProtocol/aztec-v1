/* eslint-disable prefer-arrow-callback */
<<<<<<< HEAD
const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { expect } = require('chai');
const crypto = require('crypto');
const sinon = require('sinon');
const { keccak256, padLeft } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const proof = require('../../../src/proof/joinSplit');
const proofHelpers = require('../../../src/proof/joinSplit/helpers');
const proofUtils = require('../../../src/proof/proofUtils');
const verifier = require('../../../src/proof/joinSplit/verifier');

const { errorTypes } = constants;

describe('Join Split Proof Verifier', () => {
    describe('Success States', () => {
        it('should construct a valid join-split proof', async () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const { commitments, m, trapdoor } = await proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, -10);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('should accept a join-split proof with 0 input notes', async () => {
            const kIn = [];
            const kOut = [...Array(5)].map(() => proofUtils.randomNoteValue());

            const { commitments, m, trapdoor } = await proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const kPublic = proofUtils.getKPublic(kIn, kOut);
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('should accept a join-split proof with 0 output notes', async () => {
            const kIn = [...Array(5)].map(() => proofUtils.randomNoteValue());
            const kOut = [];

            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const kPublic = proofUtils.getKPublic(kIn, kOut);
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas).to.equal(undefined);
            expect(result.pairingSigmas).to.equal(undefined);
            expect(result.valid).to.equal(true);
        });

        it('should accept a join-split proof with large numbers of notes', async () => {
            const kIn = [...Array(20)].map(() => proofUtils.randomNoteValue());
            const kOut = [...Array(20)].map(() => proofUtils.randomNoteValue());

            const { commitments, m, trapdoor } = await proofHelpers.generateFakeCommitmentSet({ kIn, kOut });

            const kPublic = proofUtils.getKPublic(kIn, kOut);
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('should accept a join-split proof with uneven number of notes', async () => {
            const { kIn, kOut } = proofUtils.generateBalancedNotes(20, 3);
            const { commitments, m, trapdoor } = await proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('should accept a join-split proof with kPublic = 0', async () => {
            const { kIn, kOut } = proofUtils.generateBalancedNotes(5, 10);
            const { commitments, m, trapdoor } = await proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
=======
const { errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { expect } = require('chai');
const sinon = require('sinon');
const { padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../../src/bn128');
const { balancedPublicValues, mockNoteSet, randomNoteValue } = require('../../helpers/note');
const { JoinSplitProof, Proof } = require('../../../src/proof');
const JoinSplitVerifier = require('../../../src/proof/joinSplit/verifier');
const { mockZeroJoinSplitProof } = require('../../helpers/proof');
const ProofUtils = require('../../../src/proof/utils');

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
            // console.log(verifier.errors);
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

        it('should verify a Join-Split proof with kPublic = 0', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes, trapdoor } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            const verifier = new JoinSplitVerifier(proof);
            const result = verifier.verifyProof();
            expect(verifier.isValid).to.equal(true);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
>>>>>>> feat(aztec.js): implement new verifiers classes
        });
    });

    describe('Failure States', () => {
<<<<<<< HEAD
        let parseInputs;
        beforeEach(() => {
            // to test Failure States we need to pass in bad data to verifier
            // so we need to turn off proof.parseInputs
            parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
        });

        afterEach(() => {
            parseInputs.restore();
        });

        it('should REJECT if points NOT on curve', () => {
            // we can construct 'proof' where all points and scalars are zero.
            // The challenge response will be correctly reconstructed, but the proof should still be invalid
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const sender = proofUtils.randomAddress();
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = `0x${new BN(keccak256(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;
            const proofData = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            const { valid, errors } = verifier.verifyProof(proofData, 1, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(5);
            expect(errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[2]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[3]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[4]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if malformed challenge', async () => {
            const kIn = [...Array(5)].map(() => proofUtils.randomNoteValue());
            const kOut = [...Array(5)].map(() => proofUtils.randomNoteValue());

            const { commitments, m } = await proofHelpers.generateCommitmentSet({
                kIn,
                kOut,
            });
            const kPublic = proofUtils.getKPublic(kIn, kOut);
            const sender = proofUtils.randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, `0x${crypto.randomBytes(31).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if notes do NOT balance', async () => {
            const { kIn, kOut } = proofUtils.generateBalancedNotes(5, 10);
            kIn.push(1);

            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT for random proof data', () => {
            const proofData = [...Array(4)].map(() =>
                [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
            );
            const sender = proofUtils.randomAddress();
            const result = verifier.verifyProof(proofData, 1, `0x${crypto.randomBytes(31).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors).to.contain(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if kPublic > group modulus', async () => {
            const { kIn, kOut } = proofUtils.generateBalancedNotes(5, 10);
            const kPublic = bn128.curve.n.add(new BN(100));
            kIn.push(100);
            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.SCALAR_TOO_BIG);
        });

        it('should REJECT if note value response is 0', async () => {
            const { kIn, kOut } = proofUtils.generateBalancedNotes(5, 10);
            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = '0x';
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if blinding factor is at infinity', async () => {
            const { kIn, kOut } = { kIn: [10], kOut: [10] };
            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should REJECT if blinding factor computed from invalid point', async () => {
            const { kIn, kOut } = { kIn: [10], kOut: [10] };
            const { commitments, m } = await proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = proofUtils.randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = `0x${padLeft('', 64)}`;
            proofData[0][1] = `0x${padLeft('', 64)}`;
            proofData[0][2] = `0x${padLeft('', 64)}`;
            proofData[0][3] = `0x${padLeft('', 64)}`;
            proofData[0][4] = `0x${padLeft('', 64)}`;
            proofData[0][5] = `0x${padLeft('', 64)}`;
            const challenge = `0x${padLeft('', 64)}`;
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(8);

            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[2]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[3]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[4]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[5]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[6]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[7]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
=======
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

        it('should reject if points NOT on curve', () => {
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

        it('should reject if notes do NOT balance', async () => {
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

        it('should reject if public value > group modulus', async () => {
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

        it('should reject if malformed challenge', async () => {
            const kIn = Array(5)
                .fill()
                .map(() => randomNoteValue());
            const kOut = Array(5)
                .fill()
                .map(() => randomNoteValue());
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

        it('should reject if malformed proof data', async () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const publicValue = -10;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            proof.data = Array(4)
                .fill()
                .map(() =>
                    Array(6)
                        .fill()
                        .map(() => `0x${padLeft(randomHex(32), 64)}`),
                );

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should reject if scalar is zero', async () => {
            const { kIn, kOut } = balancedPublicValues(5, 10);
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            proof.data[0][0] = '0x';

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.SCALAR_IS_ZERO);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should reject if blinding factor is at infinity', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            proof.data[0][0] = `0x${padLeft('05', 64)}`;
            proof.data[0][1] = `0x${padLeft('05', 64)}`;
            proof.data[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proof.data[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proof.data[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proof.data[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;

            const bogusChallengeHex = `0x${padLeft('0a', 64)}`;
            sinon.stub(proof, 'challengeHex').get(() => bogusChallengeHex);

            const verifier = new JoinSplitVerifier(proof);
            const _ = verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        // TODO: this test doesn't really make sense ... right?
        it('should reject if blinding factor computed from invalid point', async () => {
            const kIn = [10];
            const kOut = [10];
            const publicValue = 0;
            const { inputNotes, outputNotes } = await mockNoteSet(kIn, kOut);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);

            proof.data[0][0] = `0x${padLeft('0', 64)}`;
            proof.data[0][1] = `0x${padLeft('0', 64)}`;
            proof.data[0][2] = `0x${padLeft('0', 64)}`;
            proof.data[0][3] = `0x${padLeft('0', 64)}`;
            proof.data[0][4] = `0x${padLeft('0', 64)}`;
            proof.data[0][5] = `0x${padLeft('0', 64)}`;

            const bogusChallengeHex = `0x${padLeft('0', 64)}`;
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
>>>>>>> feat(aztec.js): implement new verifiers classes
        });
    });
});
