/* global, beforeEach, it:true */
const chai = require('chai');
const web3Utils = require('web3-utils');

const dividendComputation = require('../../src/proof/dividendComputation');
const { K_MAX } = require('../../src/params');

const { expect } = chai;

describe('Validating dividend computation swap proof construction and verification algos', () => {
    describe('Success cases', () => {
        let testNotes;
        let sender;
        let za;
        let zb;

        beforeEach(() => {
            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            testNotes = dividendComputation.helpers.makeTestNotes([90], [4, 50]);
            za = 100;
            zb = 5;

            // Dummy, random sender address for proof of concept
            sender = web3Utils.randomHex(20);
        });

        it('validate that the proof data contains correct number of proof variables and is well formed', () => {
            const { proofDataUnformatted, proofData } = dividendComputation.constructProof(testNotes, za, zb, sender);
            expect(proofDataUnformatted.length).to.equal(3);
            expect(proofData.length).to.equal(18);
            expect(proofDataUnformatted[0].length).to.equal(6);
            expect(proofDataUnformatted[1].length).to.equal(6);
            expect(proofDataUnformatted[2].length).to.equal(6);
        });

        it('validate that the proof is correct, using the validation algo', () => {
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(testNotes, za, zb, sender);
            const result = dividendComputation.verifyProof(proofDataUnformatted, challenge, sender, za, zb);
            expect(result).to.equal(true);
        });
    });

    describe('failure cases', () => {
        let testNotes;
        let sender;
        let za;
        let zb;

        beforeEach(() => {
            /*
            Test case:
            - k_in = 90
            - Interest rate = 5%
            - k_out = 4
            - k_res = 5
            - za = 5
            - zb = 100
            */

            testNotes = dividendComputation.helpers.makeTestNotes([90], [4, 50]);
            za = 100;
            zb = 5;

            // Dummy, random sender address for proof of concept
            sender = web3Utils.randomHex(20);
        });

        it('validate failure for incorrect number of input notes', () => {
            const tooManyNotes = dividendComputation.helpers.makeTestNotes([90, 1], [4, 50]);

            try {
                dividendComputation.constructProof(tooManyNotes, za, zb, sender);
            } catch (err) {
                console.log('Incorrect number of notes');
            }
        });

        it('validate failure for residual commitment message that does not satisfy proof relation', () => {
            const wrongRelationship = dividendComputation.helpers.makeTestNotes([90], [4, 49]);
            const { proofDataUnformatted, challenge } = dividendComputation.constructProof(wrongRelationship, za, zb, sender);

            try {
                dividendComputation.verifyProof(proofDataUnformatted, challenge, sender, za, zb);
            } catch (err) {
                console.log('Proof validation failed');
            }
        });

        it('validate failure for z_a > k_max', () => {
            const zaLarge = K_MAX + za;
            try {
                dividendComputation.constructProof(testNotes, zaLarge, zb, sender);
            } catch (err) {
                console.log('z_a is greater than or equal to kMax');
            }
        });

        it('validate failure for z_b > k_max', () => {
            const zbLarge = K_MAX + zb;
            try {
                dividendComputation.constructProof(testNotes, za, zbLarge, sender);
            } catch (err) {
                console.log('z_b is greater than or equal to kMax');
            }
        });
    });
});
