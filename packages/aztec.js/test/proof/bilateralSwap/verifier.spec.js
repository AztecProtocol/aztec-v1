/* global, beforeEach, it:true */
const { constants: { K_MAX } } = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, randomHex, sha3 } = require('web3-utils');
const sinon = require('sinon');
const utils = require('@aztec/dev-utils');


const bn128 = require('../../../src/bn128');
const bilateralProof = require('../../../src/proof/bilateralSwap');
const Keccak = require('../../../src/keccak');
const proofUtils = require('../../../src/proof/proofUtils');


const { expect } = chai;
const { ERROR_TYPES } = utils.constants;


describe('AZTEC bilateral swap verifier tests', () => {
    describe('success states', () => {
        it('bilateralProof.constructProof creates a valid bilateral swap proof', () => {
            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { proofData, challenge } = bilateralProof.constructProof(testNotes, sender);
            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(true);
            expect(errors.length).to.equal(0);
        });

        it('validate that the kbar relations are satisfied i.e. kbar1 = kbar3 and kbar2 = kbar4', () => {
            const errors = [];
            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { proofData, challenge } = bilateralProof.constructProof(testNotes, sender);
            const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData, errors);
            const formattedChallenge = new BN(challenge.slice(2), 16);

            const finalHash = new Keccak();

            proofDataBn.forEach((proofElement) => {
                finalHash.append(proofElement[6]);
                finalHash.append(proofElement[7]);
            });

            const { recoveredBlindingFactors } = proofUtils.recoverBlindingFactorsAndChallenge(proofDataBn,
                formattedChallenge,
                finalHash);

            const testkBar1 = (recoveredBlindingFactors[0].kBar).toString(16);
            const testkBar2 = (recoveredBlindingFactors[1].kBar).toString(16);
            const testkBar3 = (recoveredBlindingFactors[2].kBar).toString(16);
            const testkBar4 = (recoveredBlindingFactors[3].kBar).toString(16);

            expect(testkBar1).to.equal(testkBar3);
            expect(testkBar2).to.equal(testkBar4);
        });
    });

    describe('failure states', () => {
        it('will REJECT if malformed challenge', () => {
            // to test failure states we need to pass in bad data to verifier
            // so we need to turn off proof.parseInputs
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { proofData } = bilateralProof.constructProof(testNotes, sender);
            const fakeChallenge = `0x${crypto.randomBytes(31).toString('hex')}`;

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, fakeChallenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for random note values', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const randomNotes = proofUtils.makeTestNotes(
                [proofUtils.generateNoteValue(),
                    proofUtils.generateNoteValue()],
                [proofUtils.generateNoteValue(),
                    proofUtils.generateNoteValue()]
            );

            const sender = randomHex(20);

            const { proofData, challenge } = bilateralProof.constructProof(randomNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if bilateral swap note balancing relationship not satisfied', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const unbalancedNotes = proofUtils.makeTestNotes([10, 19], [10, 20]); // k_2 != k_4
            const sender = randomHex(20);

            const { proofData, challenge } = bilateralProof.constructProof(unbalancedNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT for random proof data', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const proofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { challenge } = bilateralProof.constructProof(testNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors).to.contain(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor is at infinity', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { proofData } = bilateralProof.constructProof(testNotes, sender);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(ERROR_TYPES.BAD_BLINDING_FACTOR);
            expect(errors[1]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor computed from scalars that are zero (kBar = 0 OR/AND aBar = 0)', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            const testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);
            const sender = randomHex(20);

            const { proofData, challenge } = bilateralProof.constructProof(testNotes, sender);
            proofData[0][0] = `0x${padLeft('', 64)}`; // kBar
            proofData[0][1] = `0x${padLeft('', 64)}`; // aBar

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(3);
            expect(errors[0]).to.equal(ERROR_TYPES.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(ERROR_TYPES.SCALAR_IS_ZERO);
            expect(errors[2]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });

        it('will REJECT if blinding factor computed from points not on the curve', () => {
            const parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });
            const sender = randomHex(20);

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

            const proofData = [...new Array(4)].map(
                () => [...new Array(6)].map(() => '0x0000000000000000000000000000000000000000000000000000000000000000')
            );

            // Making the kBars satisfy the proof relation, to ensure it's not an incorrect
            // balancing relationship that causes the test to fail
            proofData[0][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_1
            proofData[1][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_2
            proofData[2][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_3
            proofData[3][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_4

            // Setting aBars to random numbers, to ensure it's not failing due to aBar = 0
            proofData[0][1] = '0x4000000000000000000000000000000000000000000000000000000000000000'; // a_1
            proofData[1][1] = '0x5000000000000000000000000000000000000000000000000000000000000000'; // a_2
            proofData[2][1] = '0x6000000000000000000000000000000000000000000000000000000000000000'; // a_3
            proofData[3][1] = '0x7000000000000000000000000000000000000000000000000000000000000000'; // a_4

            const { valid, errors } = bilateralProof.verifier.verifyProof(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(13);

            expect(errors[0]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[1]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[2]).to.equal(ERROR_TYPES.SCALAR_TOO_BIG);
            expect(errors[3]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[4]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[5]).to.equal(ERROR_TYPES.SCALAR_TOO_BIG);
            expect(errors[6]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[7]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[8]).to.equal(ERROR_TYPES.SCALAR_TOO_BIG);
            expect(errors[9]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[10]).to.equal(ERROR_TYPES.NOT_ON_CURVE);
            expect(errors[11]).to.equal(ERROR_TYPES.SCALAR_TOO_BIG);
            expect(errors[12]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
            parseInputs.restore();
        });
    });
});
