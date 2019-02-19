/* global, beforeEach, it:true */
const chai = require('chai');
const { randomHex } = require('web3-utils');

const bilateralProof = require('../../../src/proof/bilateralSwap');
const Keccak = require('../../../src/keccak');
const proofUtils = require('../../../src/proof/proofUtils');

const { expect } = chai;


describe('AZTEC bilateral swap proof construction tests', () => {
    let testNotes;
    let sender;

    beforeEach(() => {
        testNotes = proofUtils.makeTestNotes([10, 20], [10, 20]);

        sender = randomHex(20);
    });

    it('checking that the proof logic creates a proof where blinding scalar relations are satisfied', () => {
        // i.e. bk1 = bk3 and bk2 = bk4
        const finalHash = new Keccak();

        testNotes.forEach((note) => {
            finalHash.append(note.gamma);
            finalHash.append(note.sigma);
        });

        const { blindingFactors } = proofUtils.getBlindingFactorsAndChallenge(testNotes, finalHash);

        const testk1 = (blindingFactors[0].bk).toString(16);
        const testk2 = (blindingFactors[1].bk).toString(16);
        const testk3 = (blindingFactors[2].bk).toString(16);
        const testk4 = (blindingFactors[3].bk).toString(16);

        expect(testk1).to.equal(testk3);
        expect(testk2).to.equal(testk4);
    });

    it('bilateralProof.constructProof creates a proof with well-formed outputs', () => {
        const { proofData } = bilateralProof.constructProof(testNotes, sender);
        expect(proofData.length).to.equal(4);
        expect(proofData[0].length).to.equal(6);
        expect(proofData[1].length).to.equal(6);
        expect(proofData[2].length).to.equal(6);
        expect(proofData[3].length).to.equal(6);
    });
});
