/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { randomHex } = require('web3-utils');
const utils = require('@aztec/dev-utils');


const bilateralProof = require('../../../src/proof/bilateralSwap');
const Keccak = require('../../../src/keccak');
const proofUtils = require('../../../src/proof/proofUtils');
const { K_MAX } = require('../../../src/params');

const { expect } = chai;

const { ERROR_TYPES } = utils.constants;


function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}


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

    it('bilateralProof.constructBilateralSwap creates a proof with well-formed outputs', () => {
        const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
        expect(proofData.length).to.equal(4);
        expect(proofData[0].length).to.equal(6);
        expect(proofData[1].length).to.equal(6);
        expect(proofData[2].length).to.equal(6);
        expect(proofData[3].length).to.equal(6);
    });

    it('bilateralProof.constructBilateralSwap will throw for input notes of random value', () => {
        const wrongNotes = proofUtils.makeTestNotes(
            [generateNoteValue(), generateNoteValue()], [generateNoteValue(), generateNoteValue()]
        );

        const { proofData, challenge } = bilateralProof.constructBilateralSwap(wrongNotes, sender);
        let message = '';

        try {
            bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
        } catch (err) {
            ({ message } = err);
        }
        expect(message).to.equal(ERROR_TYPES.CHALLENGE_RESPONSE_FAIL);
    });
});
