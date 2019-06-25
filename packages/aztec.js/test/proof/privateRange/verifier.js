const { constants, errors } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const { expect } = require('chai');
const { padLeft, randomHex } = require('web3-utils');
const sinon = require('sinon');

const { PrivateRangeProof } = require('../../../src/proof');
const PrivateRangeVerifier = require('../../../src/proof/privateRange/verifier');
const oldPrivateRange = require('../../../src/oldPrivateRange');
const note = require('../../../src/note');
const { Proof } = require('../../../src/proof');

describe('Private range proof Verifier', () => {
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);
    let originalNote = {};
    const originalNoteValue = 10;
    let comparisonNote = {};
    const comparisonNoteValue = 4;
    let utilityNote = {};
    const utilityNoteValue = 6;

    before(async () => {
        originalNote = await note.create(publicKey, originalNoteValue);
        comparisonNote = await note.create(publicKey, comparisonNoteValue);
        utilityNote = await note.create(publicKey, utilityNoteValue);
    });

    describe('Success States', () => {
        it.only('should verify a valid private range proof', async () => {
            console.log('old private range proof');
            console.log('proof construction');
            const { proofData, challenge } = await oldPrivateRange.constructProof([originalNote, comparisonNote, utilityNote], sender);
            console.log('verification');
            const { valid, errors } = oldPrivateRange.verifier.verifyProof(proofData, challenge, sender);
            console.log();
            console.log('new private range proof');
            console.log('proof construction');
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            console.log('verification');
            const verifier = new PrivateRangeVerifier(proof);
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
            proof.challenge = new BN(1).toRed(constants.BN128_GROUP_REDUCTION);

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
            proof.data[0][2] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][3] = `0x${constants.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][5] = `0x${constants.H_Y.toString(16)}`;
            proof.challenge = new BN(10).toRed(constants.BN128_GROUP_REDUCTION);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
