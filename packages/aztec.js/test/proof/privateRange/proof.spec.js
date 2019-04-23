/* global, beforeEach, it:true */
const chai = require('chai');

const privateRangeProof = require('../../../src/proof/privateRange');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;

describe('Private range Proof', () => {
    it('should construct a proof with well-formed outputs', () => {
        const originalValue = 10;
        const comparisonValue = 4;
        const utilityValue = 6;
        const testNotes = proofUtils.makeTestNotes(
            [originalValue, comparisonValue],
            [utilityValue]
        );

        const sender = proofUtils.randomAddress();

        const { proofData } = privateRangeProof.constructProof(testNotes, sender);
        const numNotes = 3

        expect(proofData.length).to.equal(numNotes);
        expect(proofData[0].length).to.equal(6);
        expect(proofData[1].length).to.equal(6);
        expect(proofData[2].length).to.equal(6);
    });
});
