/* eslint-disable prefer-arrow-callback */

const utils = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');
const sinon = require('sinon');
const proofUtils = require('../../../src/proof/proofUtils');

const bn128 = require('../../../src/bn128');
const secp256k1 = require('../../../src/secp256k1');
const notes = require('../../../src/note');
const proof = require('../../../src/proof/burn');
const verifier = require('../../../src/proof/burn/verifier');

const { errorTypes } = utils.constants;

const { expect } = chai;

describe('Burn proof verification tests', () => {
    describe('success states', () => {
        it('proof.constructProof creates a valid burn proof', () => {
            const newTotalBurned = 50;
            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const kIn = [newTotalBurned];
            const kOut = [oldTotalBurned, burnOne, burnTwo];
            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            const result = verifier.verifyProof(proofData, challenge, sender);

            expect(result.valid).to.equal(true);
        });

        it('validates burn proof with 0 notes burned i.e. no notes are actually burned', () => {
            const newTotalBurned = 50;
            const oldTotalBurned = 50;

            const kIn = [newTotalBurned];
            const kOut = [oldTotalBurned];

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(true);
        });

        it('validates burn proof with large number of burned notes', () => {
            const newTotalBurned = 100;
            const oldTotalBurned = 10;

            const kIn = [newTotalBurned];
            const kOut = [oldTotalBurned, 10, 10, 10, 10, 10, 10, 10, 10, 10];

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(true);
        });

        it('validates burning without any previous burned number of tokens', () => {
            const newTotalBurned = 50;
            const oldTotalBurned = 0;
            const burnOne = 25;
            const burnTwo = 25;

            const kIn = [newTotalBurned];
            const kOut = [oldTotalBurned, burnOne, burnTwo];
            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            const result = verifier.verifyProof(proofData, challenge, sender);

            expect(result.valid).to.equal(true);
        });
    });


    describe('failure states', () => {
        it('will REJECT if points not on curve', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });
            // we can construct 'proof' where all points and scalars are zero.
            // The challenge response will be correctly reconstructed, but the proof should still be invalid
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const sender = proofUtils.randomAddress();
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;

            const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;
            const proofData = [
                [`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0'],
                [`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0'],
                [`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0'],
            ];

            const { valid, errors } = verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(13);
            expect(errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[2]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[3]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[4]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[5]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[6]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[7]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[8]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[9]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[10]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[11]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[12]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);

            parseInputs.restore();
        });

        it('will REJECT if malformed challenge', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const newTotalBurned = 50;
            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalBurned], [oldTotalBurned, burnOne, burnTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData } = proof.constructProof(testNotes, sender);

            const result = verifier.verifyProof(proofData, `0x${crypto.randomBytes(31).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if notes do not balance', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const newTotalBurned = 500; // 500 + oldTotalBurned + burnOne + burnTwo;

            const testNotes = proofUtils.makeTestNotes([newTotalBurned], [oldTotalBurned, burnOne, burnTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            const result = verifier.verifyProof(proofData, challenge, sender);

            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for random proof data', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const proofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));
            const sender = proofUtils.randomAddress();

            const result = verifier.verifyProof(proofData, `0x${crypto.randomBytes(32).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors).to.contain(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if note value response is 0', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const newTotalBurned = 50;
            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalBurned], [oldTotalBurned, burnOne, burnTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            proofData[0][0] = '0x';

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor is at infinity', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const newTotalBurned = 50;
            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalBurned], [oldTotalBurned, burnOne, burnTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData } = proof.constructProof(testNotes, sender);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor computed from invalid point', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const newTotalBurned = 50;
            const oldTotalBurned = 30;
            const burnOne = 10;
            const burnTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalBurned], [oldTotalBurned, burnOne, burnTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData } = proof.constructProof(testNotes, sender, 0);
            proofData[0][0] = `0x${padLeft('', 64)}`;
            proofData[0][1] = `0x${padLeft('', 64)}`;
            proofData[0][2] = `0x${padLeft('', 64)}`;
            proofData[0][3] = `0x${padLeft('', 64)}`;
            proofData[0][4] = `0x${padLeft('', 64)}`;
            proofData[0][5] = `0x${padLeft('', 64)}`;
            const challenge = `0x${padLeft('', 64)}`;
            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(7);

            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[2]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[3]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[4]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[5]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[6]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if number of notes supplied is less than 2', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const noteValue = 50;
            const testNote = notes.create(secp256k1.generateAccount().publicKey, noteValue);
            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = proof.constructProof(testNote, sender, 0);

            const result = verifier.verifyProof(proofData, challenge, sender);

            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(3);

            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            expect(result.errors[2]).to.equal(errorTypes.INCORRECT_NOTE_NUMBER);
            parseInputs.restore();
        });
    });
});
