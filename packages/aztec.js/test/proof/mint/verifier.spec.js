/* eslint-disable prefer-arrow-callback */

const utils = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');
const sinon = require('sinon');
const proofUtils = require('../../../src/proof/proofUtils');

const bn128 = require('../../../src/bn128');
const proof = require('../../../src/proof/mint');
const verifier = require('../../../src/proof/mint/verifier');

const { errorTypes } = utils.constants;

const { expect } = chai;

describe('Mint proof verification tests', () => {
    describe('success states', () => {
        it('proof.constructProof creates a valid join-split proof', () => {
            const newTotalMinted = 50;
            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const kIn = [newTotalMinted];
            const kOut = [oldTotalMinted, mintOne, mintTwo];
            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            const result = verifier.verifyProof(proofData, challenge, sender);

            expect(result.valid).to.equal(true);
        });

        it('validates mint proof with 0 notes minted i.e. no notes are actually minted', () => {
            const newTotalMinted = 50;
            const oldTotalMinted = 50;

            const kIn = [newTotalMinted];
            const kOut = [oldTotalMinted];

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(true);
        });

        it('validates mint proof with large number of minted notes', () => {
            const newTotalMinted = 100;
            const oldTotalMinted = 10;

            const kIn = [newTotalMinted];
            const kOut = [oldTotalMinted, 10, 10, 10, 10, 10, 10, 10, 10, 10];

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes(kIn, kOut);

            const { proofData, challenge } = proof.constructProof(testNotes, sender);

            const result = verifier.verifyProof(proofData, challenge, sender);
            expect(result.valid).to.equal(true);
        });

        it('validates minting without any previous minted number of tokens', () => {
            const newTotalMinted = 50;
            const oldTotalMinted = 0;
            const mintOne = 25;
            const mintTwo = 25;

            const kIn = [newTotalMinted];
            const kOut = [oldTotalMinted, mintOne, mintTwo];
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
            const proofData = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            const { valid, errors } = verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(6);
            expect(errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[2]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[3]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[4]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[5]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);

            parseInputs.restore();
        });

        it('will REJECT if malformed challenge', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const newTotalMinted = 50;
            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalMinted], [oldTotalMinted, mintOne, mintTwo]);
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

            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const newTotalMinted = 500; // 500 + oldTotalMinted + mintOne + mintTwo;

            const testNotes = proofUtils.makeTestNotes([newTotalMinted], [oldTotalMinted, mintOne, mintTwo]);
            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = proof.constructProof(testNotes, sender);
            console.log('original challenge: ', challenge);
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

            const newTotalMinted = 50;
            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalMinted], [oldTotalMinted, mintOne, mintTwo]);
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

            const newTotalMinted = 50;
            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalMinted], [oldTotalMinted, mintOne, mintTwo]);
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

            const newTotalMinted = 50;
            const oldTotalMinted = 30;
            const mintOne = 10;
            const mintTwo = 10;

            const testNotes = proofUtils.makeTestNotes([newTotalMinted], [oldTotalMinted, mintOne, mintTwo]);
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
    });
});
