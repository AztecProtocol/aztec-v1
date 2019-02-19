/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, randomHex, sha3 } = require('web3-utils');
const sinon = require('sinon');
const utils = require('@aztec/dev-utils');


const bn128 = require('../../../src/bn128');
const bilateralProof = require('../../../src/proof/bilateralSwap');
const Keccak = require('../../../src/keccak');
const { K_MAX } = require('../../../src/params');
const proofUtils = require('../../../src/proof/proofUtils');


const { expect } = chai;
const { ERROR_TYPES } = utils.constants;


function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}


describe('AZTEC bilateral swap verifier tests', () => {
    describe('success states', () => {
        let testNotes;
        let sender;

        beforeEach(() => {
            testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);

            sender = randomHex(20);
        });

        it('bilateralProof.constructBilateralSwap creates a valid bilateral swap proof', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const result = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            expect(result.valid).to.equal(true);
        });

        it('validate that the kbar relations are satisfied i.e. kbar1 = kbar3 and kbar2 = kbar4', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const proofDataBn = proofUtils.convertToBNAndAppendPoints(proofData);
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
        let testNotes;
        let sender;
        let parseInputs;

        beforeEach(() => {
            // to test failure states we need to pass in bad data to verifier
            // so we need to turn off proof.parseInputs
            parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => { });

            testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);

            sender = randomHex(20);
        });

        afterEach(() => {
            parseInputs.restore();
        });

        it('will REJECT if malformed challenge', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const fakeChallenge = `0x${crypto.randomBytes(31).toString('hex')}`;

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, fakeChallenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT for random note values', () => {
            const randomNotes = proofUtils.makeTestNotes(
                [generateNoteValue(), generateNoteValue()], [generateNoteValue(), generateNoteValue()]
            );
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(randomNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT if bilateral swap note balancing relationship not satisfied', () => {
            const unbalancedNotes = proofUtils.makeTestNotes([10, 19], [10, 20]); // k_2 != k_4
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(unbalancedNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT for random proof data', () => {
            const proofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const { challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);

            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT if blinding factor is at infinity', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(2);
            expect(errors[0]).to.equal(ERROR_TYPES.BAD_BLINDING_FACTOR);
            expect(errors[1]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT if blinding factor computed from scalars that are zero (kBar = 0 OR/AND aBar = 0)', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            proofData[0][0] = `0x${padLeft('', 64)}`; // kBar
            proofData[0][1] = `0x${padLeft('', 64)}`; // aBar

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(3);
            expect(errors[0]).to.equal(ERROR_TYPES.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(ERROR_TYPES.SCALAR_IS_ZERO);
            expect(errors[2]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });

        it('will REJECT if blinding factor computed from points not on the curve', () => {
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

            const { valid, errors } = bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(1);
            expect(errors[0]).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
