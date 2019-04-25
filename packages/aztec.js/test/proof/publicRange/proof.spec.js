/* global, beforeEach, it:true */
const chai = require('chai');
const publicRange = require('../../../src/proof/publicRange');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;

describe('Public range proof', () => {
    it('should construct a proof with well-formed outputs', async () => {
        const testNotes = await proofUtils.makeTestNotes([50], [40]);
        const kPublic = 10;

        const sender = proofUtils.randomAddress(20);
        const { proofData, challenge } = publicRange.constructProof(testNotes, kPublic, sender);

        expect(proofData.length).to.equal(2);
        expect(challenge.length).to.equal(66);
        expect(proofData[0].length).to.equal(6);
        expect(proofData[1].length).to.equal(6);
    });
});
