/* global, beforeEach, it:true */
const BN = require('bn.js');
const chai = require('chai');
const web3Utils = require('web3-utils');


const bilateralProof = require('../../src/proof/bilateralSwap');
const helpers = require('../../src/proof/bilateralSwap/helpers');
const Keccak = require('../../src/keccak');


const { expect } = chai;


describe('Validating bilateral swap proof construction and verification algos', () => {
    describe('Validate properties of the proof construction algo', () => {
        let testNotes;
        let sender;

        beforeEach(() => {
            testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

            // Dummy, random sender address for proof of concept
            sender = web3Utils.randomHex(20);
        });

        it('validate that the bilateral swap blinding scalar relations are satisfied i.e. bk1 = bk3 and bk2 = bk4', () => {
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

        it('validate that the proof data contains correct number of proof variables and is well formed', () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, sender);
            expect(proofData.length).to.equal(4);
            expect(proofData[0].length).to.equal(6);
            expect(proofData[1].length).to.equal(6);
            expect(proofData[2].length).to.equal(6);
            expect(proofData[3].length).to.equal(6);
        });

        it('validate that the proof is correct, using the validation algo', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const result = bilateralProof.verifyBilateralSwap(proofData, challenge, sender);
            expect(result).to.equal(true);
        });

        it('validate failure when inputs points are not on the curve', () => {
            // Setting the x and y coordinates of the commitment to zero - i.e. not on the curve
            // Should then fail to be validated, as points aren't on the curve
            const zeroes = `${web3Utils.padLeft('0', 64)}`;
            const noteString = `${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}`;
            const challengeString = `0x${web3Utils.padLeft(sender.slice(2), 64)}${web3Utils.padLeft('132', 64)}${web3Utils.padLeft('1', 64)}${noteString}`;
            const challenge = web3Utils.sha3(challengeString, 'hex');
            const proofData = [[`0x${web3Utils.padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];
       
            try {
                bilateralProof.verifyBilateralSwap(proofData, challenge, sender);
            } catch (err) {
                console.log('point not on the curve');
            }
        });
    });

    describe('validate properties of the proof validation algo', () => {
        let proofData;
        let challenge;
        let sender;

        beforeEach(() => {
            const testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

            // Dummy, random sender address for proof of concept
            sender = web3Utils.randomHex(20);

            ({ proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender));
        });

        it('validate that the kbar relations are satisfied i.e. kbar1 = kbar3 and kbar2 = kbar4', () => {
            const proofDataBn = helpers.toBnAndAppendPoints(proofData);
            const formattedChallenge = new BN(challenge.slice(2), 16);

            const finalHash = new Keccak();

            proofDataBn.forEach((proofElement) => {
                finalHash.append(proofElement[6]);
                finalHash.append(proofElement[7]);
            });

            const { recoveredBlindingFactors } = helpers.recoverBlindingFactorsAndChallenge(proofDataBn, formattedChallenge, finalHash);

            const testkBar1 = (recoveredBlindingFactors[0].kBar).toString(16);
            const testkBar2 = (recoveredBlindingFactors[1].kBar).toString(16);
            const testkBar3 = (recoveredBlindingFactors[2].kBar).toString(16);
            const testkBar4 = (recoveredBlindingFactors[3].kBar).toString(16);

            expect(testkBar1).to.equal(testkBar3);
            expect(testkBar2).to.equal(testkBar4);
        });
    });

    describe('validate that proof construction algo is valid, using validation algo', () => {
        let testNotes;
        let sender;

        beforeEach(() => {
            testNotes = helpers.makeTestNotes([10, 20], [10, 20]);

            // Dummy, random sender address for proof of concept
            sender = web3Utils.randomHex(20);
        });

        it('validate that the proof is correct, using the validation algo', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, sender);
            const result = bilateralProof.verifyBilateralSwap(proofData, challenge, sender);
            expect(result).to.equal(true);
        });
    });
});
