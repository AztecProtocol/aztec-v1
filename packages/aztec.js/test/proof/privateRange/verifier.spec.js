/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const bn128 = require('../../../src/bn128');
const privateRangeProof = require('../../../src/proof/privateRange');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;
const { errorTypes } = utils.constants;

describe('Private range proof verifier', () => {
    describe('Success States', () => {
        it('should construct a valid private range proof ', () => {
            const originalValue = 10;
            const comparisonValue = 4;
            const utilityValue = 6;

            const testNotes = proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue]);

            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = privateRangeProof.constructProof(testNotes, sender);
            const { valid, errors } = privateRangeProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(true);
            expect(errors.length).to.equal(0);
        });

        it('validate success when a comparison note of 0 value is used', () => {
            const originalValue = 10;
            const comparisonValue = 0;
            const utilityValue = 10;

            const testNotes = proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue]);

            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = privateRangeProof.constructProof(testNotes, sender);
            const { valid, errors } = privateRangeProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(true);
            expect(errors.length).to.equal(0);
        });
    });

    describe('Failure states', () => {
        it('validate failure for incorrect balancing relation', () => {
            const originalValue = 10;
            const comparisonValue = 5;
            const utilityValue = 6;

            const testNotes = proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue]);

            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = privateRangeProof.constructProof(testNotes, sender);
            const { valid, errors } = privateRangeProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('validate failure when comparison is not satisfied', () => {
            const originalValue = 20;
            const comparisonValue = 30;
            const utilityValue = -10;

            const testNotes = proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue]);

            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = privateRangeProof.constructProof(testNotes, sender);
            const { valid, errors } = privateRangeProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('validate failure for random challenge', () => {
            const originalValue = 10;
            const comparisonValue = 4;
            const utilityValue = 6;

            const testNotes = proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue]);

            const sender = proofUtils.randomAddress();

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const fakeChallenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const { proofData } = privateRangeProof.constructProof(testNotes, sender);
            const { valid, errors } = privateRangeProof.verifier.verifyProof(proofData, fakeChallenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
