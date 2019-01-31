/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');


// ### Internal Dependencies
const aztec = require('aztec.js');
const { params: { t2, GROUP_MODULUS } } = require('aztec.js');
const exceptions = require('../../utils/exceptions');

// ### Artifacts
const BilateralSwap = artifacts.require('../../contracts/AZTEC/BilateralSwap');
const BilateralSwapInterface = artifacts.require('../../contracts/AZTEC/BilateralSwapInterface');

BilateralSwap.abi = BilateralSwapInterface.abi;

/*
Outline of test:
- This needs to be able to run on Truffle - to test the smart contract feature
- Construct success states
- Generate a proof using the BilateralSwap javascript proof generation code
- Validate that it works, first using the javascript proof verification code
- Validate that it works, using the bilateral swap smart construct
*/

contract('BilateralSwap', (accounts) => {
    describe('success states', () => {
        let bilateralSwap;
        let testNotes;

        beforeEach(async () => {
            bilateralSwap = await BilateralSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('validate that the Javascript proof is constructed correctly', () => {
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(testNotes, accounts[0]);
            const result = aztec.proof.bilateralSwap.verifyBilateralSwap(proofData, challenge, accounts[0]);
            expect(result).to.equal(true);
        });

        it('validate that the smart contract can verify the bilateral swap proof', async () => {
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(testNotes, accounts[0]);

            const result = await bilateralSwap.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            const gasUsed = await bilateralSwap.validateBilateralSwap.estimateGas(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });
    });

    describe('failure cases', () => {
        let bilateralSwapContract;
        let testNotes;

        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const makerNoteValues = [10, 50];
            const takerNoteValues = [20, 20];
            const incorrectTestNoteValues = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(incorrectTestNoteValues, accounts[0]);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const makerNoteValues = [10, 20, 30];
            const takerNoteValues = [10, 20, 30];
            const incorrectNumberOfNotes = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(incorrectNumberOfNotes, accounts[0]);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for a bid note of zero value', async () => {
            const makerNoteValues = [0, 20];
            const takerNoteValues = [10, 20];
            const NotesWithAZero = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(NotesWithAZero, accounts[0]);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using a fake challenge', async () => {
            const { proofData } = aztec.proof.bilateralSwap.constructBilateralSwap(testNotes, accounts[0]);

            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, fakeChallenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using fake proof data', async () => {
            const { challenge } = aztec.proof.bilateralSwap.constructBilateralSwap(testNotes, accounts[0]);

            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(fakeProofData, challenge, t2, {
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

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
