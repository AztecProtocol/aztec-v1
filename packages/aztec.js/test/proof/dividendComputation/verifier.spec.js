/* global, beforeEach, it:true */
const { constants: { K_MAX } } = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');
const sinon = require('sinon');
const utils = require('@aztec/dev-utils');


const bn128 = require('../../../src/bn128');
const dividendComputation = require('../../../src/proof/dividendComputation');
const proofUtils = require('../../../src/proof/proofUtils');

const { errorTypes } = utils.constants;

const { expect } = chai;

describe('Dividend computation verifier tests', () => {
    describe('success states', () => {
        it('dividendComputation.constructProof creates a valid dividend computation proof', () => {
            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);
            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, za, zb, sender);
            const { valid } = dividendComputation.verifier.verifyProof(proofDataUnformatted, challenge, sender, za, zb);
            expect(valid).to.equal(true);
        });
    });


    describe('failure states', () => {
        it('will REJECT for unsatisfied proof relations', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();

            const wrongRelationship = proofUtils.makeTestNotes([90], [4, 49]);
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(wrongRelationship, za, zb, sender);

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                za,
                zb
            );

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for fake challenge', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const { proofDataUnformatted } = dividendComputation.constructProof(testNotes, za, zb, sender);

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const fakeChallenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                fakeChallenge,
                sender,
                za,
                zb
            );

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for fake proof data', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const { challenge } = dividendComputation.constructProof(testNotes, za, zb, sender);

            const fakeProofData = [...Array(3)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                fakeProofData,
                challenge,
                sender,
                za,
                zb
            );

            expect(valid).to.equal(false);
            expect(errors).to.contain(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });


        it('will REJECT for z_a > k_max', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const zaLarge = K_MAX + za;
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, zaLarge, zb, sender);

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                zaLarge,
                zb
            );

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.ZA_TOO_BIG);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for z_b > k_max', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const zbLarge = K_MAX + zb;
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, za, zbLarge, sender);

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                za,
                zbLarge
            );

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.ZB_TOO_BIG);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if point not on the curve', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, za, zb, sender);

            // Setting the x coordiante of gamma to zero
            proofDataUnformatted[0][2] = '0x0000000000000000000000000000000000000000000000000000000000000000';

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                za,
                zb
            );
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor at infinity', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const { proofDataUnformatted } = dividendComputation.constructProof(testNotes, za, zb, sender);
            proofDataUnformatted[0][0] = `0x${padLeft('05', 64)}`;
            proofDataUnformatted[0][1] = `0x${padLeft('05', 64)}`;
            proofDataUnformatted[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataUnformatted[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofDataUnformatted[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofDataUnformatted[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                za,
                zb
            );

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor computed from invalid point', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            const za = 100;
            const zb = 5;

            const sender = proofUtils.randomAddress();
            const testNotes = proofUtils.makeTestNotes([90], [4, 50]);

            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, za, zb, sender);
            proofDataUnformatted[0][0] = `0x${padLeft('', 64)}`;
            proofDataUnformatted[0][1] = `0x${padLeft('', 64)}`;
            proofDataUnformatted[0][2] = `0x${padLeft('', 64)}`;
            proofDataUnformatted[0][3] = `0x${padLeft('', 64)}`;
            proofDataUnformatted[0][4] = `0x${padLeft('', 64)}`;
            proofDataUnformatted[0][5] = `0x${padLeft('', 64)}`;

            const { valid, errors } = dividendComputation.verifier.verifyProof(
                proofDataUnformatted,
                challenge,
                sender,
                za,
                zb
            );

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
