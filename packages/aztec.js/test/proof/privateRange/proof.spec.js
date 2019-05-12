/* global, beforeEach, it:true */
const chai = require('chai');

const privateRangeProof = require('../../../src/proof/privateRange');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;

describe('Private range proof', () => {
    describe('Success states', () => {
        it('should construct a proof with well-formed outputs', async () => {
            const originalValue = 10;
            const comparisonValue = 4;
            const utilityValue = 6;

            const testNotes = await proofUtils.makeTestNotes([originalValue], [comparisonValue, utilityValue]);

            const sender = proofUtils.randomAddress();

            const { proofData } = await privateRangeProof.constructProof(testNotes, sender);
            const numNotes = 3;

            expect(proofData.length).to.equal(numNotes);
            expect(proofData[0].length).to.equal(6);
            expect(proofData[1].length).to.equal(6);
            expect(proofData[2].length).to.equal(6);
        });
    })

    describe('Failure states', () => {
        it('should fail if number of notes is greater than 3', async () => {
            const originalValue = 10;
            const comparisonValue = 4;
            const extraTestNote = 5
            const utilityValue = 1;

            const testNotes = await proofUtils.makeTestNotes([originalValue, comparisonValue], [utilityValue, extraTestNote]);

            const sender = proofUtils.randomAddress();

            try {
                await privateRangeProof.constructProof(testNotes, sender);
            } catch (err) {
                expect(err.message).to.contain('INCORRECT_NOTE_NUMBER');
            }
        });
    })
});
