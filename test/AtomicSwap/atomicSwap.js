/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');


// ### Internal Dependencies
const exceptions = require('../exceptions');
const { t2, GROUP_MODULUS } = require('../../aztec-crypto-js/params');
const atomicProof = require('../../aztec-crypto-js/proof/atomicSwapProof');
const atomicSwapHelpers = require('../../aztec-crypto-js/proof/atomicSwapHelpers');

// ### Artifacts
const AtomicSwap = artifacts.require('../../contracts/AZTEC/AtomicSwap');
const AtomicSwapInterface = artifacts.require('../../contracts/AZTEC/AtomicSwapInterface');

const { toBytes32 } = require('../../aztec-crypto-js/utils/utils');

AtomicSwap.abi = AtomicSwapInterface.abi;

/*
Outline of test:
- This needs to be able to run on Truffle - to test the smart contract feature
- Construct success states
- Generate a proof using the AtomicSwap javascript proof generation code
- Validate that it works, first using the javascript proof verification code
- Validate that it works, using the atomic swap smart construct
*/

contract('AtomicSwap tests', (accounts) => {
    describe('success states', () => {
        let atomicSwap;
        let testNotes;

        beforeEach(async () => {
            atomicSwap = await AtomicSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('validate that the Javascript proof is constructed correctly', () => {
            const { proofData, challenge } = atomicProof.constructAtomicSwap(testNotes, accounts[0]);
            const result = atomicProof.verifyAtomicSwap(proofData, challenge, accounts[0]);
            expect(result).to.equal(true);
        });

        it('validate that the smart contract can verify the atomic swap proof', async () => {
            const { proofData, challenge } = atomicProof.constructAtomicSwap(testNotes, accounts[0]);

            const result = await atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            const gasUsed = await atomicSwap.validateAtomicSwap.estimateGas(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
            expect(result).to.equal(true);
        });
    });

    describe('failure cases', () => {
        let atomicSwap;
        let testNotes;

        beforeEach(async () => {
            atomicSwap = await AtomicSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const makerNoteValues = [10, 50];
            const takerNoteValues = [20, 20];
            const incorrectTestNoteValues = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = atomicProof.constructAtomicSwap(incorrectTestNoteValues, accounts[0]);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const makerNoteValues = [10, 20, 30];
            const takerNoteValues = [10, 20, 30];
            const incorrectNumberOfNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = atomicProof.constructAtomicSwap(incorrectNumberOfNotes, accounts[0]);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for a bid note of zero value', async () => {
            const makerNoteValues = [0, 20];
            const takerNoteValues = [10, 20];
            const NotesWithAZero = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = atomicProof.constructAtomicSwap(NotesWithAZero, accounts[0]);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using a fake challenge', async () => {
            const { proofData } = atomicProof.constructAtomicSwap(testNotes, accounts[0]);

            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, fakeChallenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using fake proof data', async () => {
            const { challenge } = atomicProof.constructAtomicSwap(testNotes, accounts[0]);
     
            const fakeProofData = new Array(4).map(() => new Array(6).map(() => toBytes32.randomBytes32()));

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(fakeProofData, challenge, t2, {
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

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
