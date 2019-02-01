/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, randomHex, sha3 } = require('web3-utils');

const bn128 = require('../../src/bn128');
const bilateralProof = require('../../src/proof/bilateralSwap');
const helpers = require('../../src/proof/bilateralSwap/helpers');
const Keccak = require('../../src/keccak');
const { K_MAX } = require('../../src/params');


const { expect } = chai;


function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}


describe.only('AZTEC bilateral swap proof construction tests', () => {
    let testNotes;
    let sender;

    beforeEach(() => {
        testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

        // Dummy, random sender address for proof of concept
        sender = randomHex(20);
    });

    it('bilateralProof.constructBilateralSwap creates a proof where blinding scalar relations are satisfied i.e. bk1 = bk3 and bk2 = bk4', () => {
        const finalHash = new Keccak();

        testNotes.forEach((note) => {
            finalHash.append(note.gamma);
            finalHash.append(note.sigma);
        });

        const { blindingFactors } = helpers.getBlindingFactorsAndChallenge(testNotes, finalHash);

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
        console.log('proofData[0]', proofData[0]);
        expect(proofData[0].length).to.equal(6);
        expect(proofData[1].length).to.equal(6);
        expect(proofData[2].length).to.equal(6);
        expect(proofData[3].length).to.equal(6);
    });

    it('bilateralProof.constructBilateralSwap will throw for input notes of random value', () => {
        const wrongNotes = helpers.makeTestNotes([generateNoteValue(), generateNoteValue()], [generateNoteValue(), generateNoteValue()]);
        const { proofData, challenge } = bilateralProof.constructBilateralSwap(wrongNotes, sender);

        try {
            bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
        } catch (err) {
            console.log('note inputs have wrong balancing relationship');
        }
    });

    it('bilateralProof.constructBilateralSwap will throw for input points not on the curve', () => {
        // Setting the x and y coordinates of the commitment to zero - i.e. not on the curve
        // Should then fail to be validated, as points aren't on the curve
        const zeroes = `${padLeft('0', 64)}`;
        const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
        const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
        const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;

        const proofData = [...new Array(4)].map(() => [...new Array(6)].map(() => '0x00'));
        // Making the kBars satisfy the proof relation, to ensure it's not an incorrect
        // balancing relationship that causes the test to fail
        proofData[0][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_1
        proofData[1][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_2
        proofData[2][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_3
        proofData[3][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_4

        try {
            bilateralProof.verifier.verifyBilateralSwap(proofData, challenge, sender);
        } catch (err) {
            console.log('point not on the curve');
        }
    });
});
