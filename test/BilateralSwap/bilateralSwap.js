/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');


// ### Internal Dependencies
const exceptions = require('../exceptions');
const { t2, GROUP_MODULUS } = require('../../aztec-crypto-js/params');
const bilateralProof = require('../../aztec-crypto-js/proof/bilateralProof');
const helpers = require('../../aztec-crypto-js/proof/helpers');

// ### Artifacts
const BilateralSwap = artifacts.require('../../contracts/AZTEC/BilateralSwap');
const BilateralSwapInterface = artifacts.require('../../contracts/AZTEC/BilateralSwapInterface');

const { toBytes32 } = require('../../aztec-crypto-js/utils/utils');

BilateralSwap.abi = BilateralSwapInterface.abi;

/*
Outline of test:
- This needs to be able to run on Truffle - to test the smart contract feature
- Construct success states
- Generate a proof using the BilateralSwap javascript proof generation code
- Validate that it works, first using the javascript proof verification code
- Validate that it works, using the bilateral swap smart construct
*/

contract('BilateralSwap tests', (accounts) => {
    describe('success states', () => {
        let BilateralSwap;
        let testNotes;

        beforeEach(async () => {
            BilateralSwap = await BilateralSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = helpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('validate that the Javascript proof is constructed correctly', () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, accounts[0]);
            const result = bilateralProof.verifyBilateralSwap(proofData, challenge, accounts[0]);
            expect(result).to.equal(true);
        });

        it('validate that the smart contract can verify the bilateral swap proof', async () => {
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(testNotes, accounts[0]);

            const result = await BilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            const gasUsed = await BilateralSwap.validateBilateralSwap.estimateGas(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });
    });

    describe('failure cases', () => {
        let BilateralSwap;
        let testNotes;

        beforeEach(async () => {
            BilateralSwap = await BilateralSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = helpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const makerNoteValues = [10, 50];
            const takerNoteValues = [20, 20];
            const incorrectTestNoteValues = helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(incorrectTestNoteValues, accounts[0]);

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const makerNoteValues = [10, 20, 30];
            const takerNoteValues = [10, 20, 30];
            const incorrectNumberOfNotes = helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(incorrectNumberOfNotes, accounts[0]);

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for a bid note of zero value', async () => {
            const makerNoteValues = [0, 20];
            const takerNoteValues = [10, 20];
            const NotesWithAZero = helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = bilateralProof.constructBilateralSwap(NotesWithAZero, accounts[0]);

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using a fake challenge', async () => {
            const { proofData } = bilateralProof.constructBilateralSwap(testNotes, accounts[0]);

            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(proofData, fakeChallenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using fake proof data', async () => {
            const { challenge } = bilateralProof.constructBilateralSwap(testNotes, accounts[0]);
     
            const fakeProofData = new Array(4).map(() => new Array(6).map(() => toBytes32.randomBytes32()));

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(fakeProofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when points not on curve', async () => {
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = `${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}${zeroes}`;
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');
            const proofData = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            await exceptions.catchRevert(BilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
