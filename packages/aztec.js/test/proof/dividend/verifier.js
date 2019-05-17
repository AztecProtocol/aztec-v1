const { constants, errors } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const { expect } = require('chai');
const { padLeft, randomHex } = require('web3-utils');
const sinon = require('sinon');

const bn128 = require('../../../src/bn128');
const { DividendProof } = require('../../../src/proof');
const DividendVerifier = require('../../../src/proof/dividend/verifier');
const note = require('../../../src/note');
const { Proof } = require('../../../src/proof');

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

        it('should reject if unsatisfied proof relations', async () => {
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

        it('should reject if bogus challenge', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            proof.challenge = new BN(1).toRed(constants.BN128_GROUP_REDUCTION);
            const bogusChallengeHex = `0x${padLeft(proof.challenge.toString(16), 64)}`;
            sinon.stub(proof, 'challengeHex').value(bogusChallengeHex);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(1);
            expect(verifier.errors[0]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should reject if fake proof data', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            proof.data = Array(3)
                .fill()
                .map(() => {
                    return Array(6)
                        .fill()
                        .map(() => randomHex(64));
                });

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors[verifier.errors.length - 1]).to.contain(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should reject if z_a > K_MAX', async () => {
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

        it('should reject if z_b > k_max', async () => {
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

        it('should reject if point not on the curve', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            // Set the x coordinate of gamma to zero
            proof.data[0][2] = `0x${padLeft('', 64)}`;

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.NOT_ON_CURVE);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });

        it('should reject if blinding factor at infinity', async () => {
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);

            proof.data[0][0] = `0x${padLeft('05', 64)}`;
            proof.data[0][1] = `0x${padLeft('05', 64)}`;
            proof.data[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proof.data[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proof.data[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proof.data[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;

            proof.challenge = new BN(10).toRed(constants.BN128_GROUP_REDUCTION);
            const bogusChallengeHex = `0x${padLeft(proof.challenge.toString(16), 64)}`;
            sinon.stub(proof, 'challengeHex').value(bogusChallengeHex);

            const verifier = new DividendVerifier(proof);
            verifier.verifyProof();
            expect(verifier.isValid).to.equal(false);
            expect(verifier.errors.length).to.equal(2);
            expect(verifier.errors[0]).to.equal(errors.codes.BAD_BLINDING_FACTOR);
            expect(verifier.errors[1]).to.equal(errors.codes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
