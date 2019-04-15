/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');
const sinon = require('sinon');
const utils = require('@aztec/dev-utils');

const bn128 = require('../../../src/bn128');
const publicRange = require('../../../src/proof/publicRange');
const proofUtils = require('../../../src/proof/proofUtils');

const { errorTypes } = utils.constants;

const { expect } = chai;

describe('Public range proof verifier', () => {
    describe('Success States', () => {
        it('should construct a valid dividend computation proof', () => {
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();
            const { proofData, challenge } = publicRange.constructProof(testNotes, u, sender);
            const { valid } = publicRange.verifier.verifyProof(proofData, challenge, sender, u);
            expect(valid).to.equal(true);
        });
    });

    describe('Failure States', () => {
        it('should REJECT for unsatisfied proof relations', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const wrongRelationship = proofUtils.makeTestNotes([50], [41]);
            const u = 10;
            const sender = proofUtils.randomAddress();

            const { proofData, challenge } = publicRange.constructProof(wrongRelationship, u, sender);

            const { valid, errors } = publicRange.verifier.verifyProof(proofData, challenge, sender, u);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('should REJECT for fake challenge', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();


            const { proofData } = publicRange.constructProof(testNotes, u, sender);

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const fakeChallenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const { valid, errors } = publicRange.verifier.verifyProof(
                proofData,
                fakeChallenge,
                sender,
                u
            );
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('should REJECT for fake proof data', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();


            const { challenge } = publicRange.constructProof(testNotes, u, sender);

            const fakeProofData = [...Array(2)].map(() =>
                [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
            );

            const { valid, errors } = publicRange.verifier.verifyProof(fakeProofData, challenge, sender, u);
            expect(valid).to.equal(false);
            expect(errors).to.contain(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });


        it('should REJECT if point not on the curve', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();


            const { proofData, challenge } = publicRange.constructProof(testNotes, u, sender);

            // Setting the x coordinate of gamma to zero
            proofData[0][2] = '0x0000000000000000000000000000000000000000000000000000000000000000';

            const { valid, errors } = publicRange.verifier.verifyProof(proofData, challenge, sender, u);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('should REJECT if blinding factor at infinity', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();


            const { proofData } = publicRange.constructProof(testNotes, u, sender);

            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            const { valid, errors } = publicRange.verifier.verifyProof(proofData, challenge, sender, u);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('should REJECT if blinding factor computed from invalid point', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
            const testNotes = proofUtils.makeTestNotes([50], [40]);
            const u = 10;
            const sender = proofUtils.randomAddress();


            const { proofData, challenge } = publicRange.constructProof(testNotes, u, sender);

            proofData[0][0] = `0x${padLeft('', 64)}`;
            proofData[0][1] = `0x${padLeft('', 64)}`;
            proofData[0][2] = `0x${padLeft('', 64)}`;
            proofData[0][3] = `0x${padLeft('', 64)}`;
            proofData[0][4] = `0x${padLeft('', 64)}`;
            proofData[0][5] = `0x${padLeft('', 64)}`;

            const { valid, errors } = publicRange.verifier.verifyProof(proofData, challenge, sender, u);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(6);
            expect(errors[0]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[1]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[2]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[3]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[4]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[5]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });
    });
});
