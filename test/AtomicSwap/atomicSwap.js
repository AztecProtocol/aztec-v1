/* global artifacts, expect, contract, beforeEach, it:true */

// ### Internal Dependencies
const exceptions = require('../exceptions');
const { t2 } = require('../../aztec-crypto-js/params');
const atomicProof = require('../../aztec-crypto-js/proof/atomicSwapProof');
const atomicSwapHelpers = require('../../aztec-crypto-js/proof/atomicSwapHelpers');

// ### Artifacts
const AtomicSwap = artifacts.require('../../contracts/AZTEC/AtomicSwap');
const AtomicSwapInterface = artifacts.require('../../contracts/AZTEC/AtomicSwapInterface');


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
        let testNotes;
        let atomicSwap;

        beforeEach(async () => {
            atomicSwap = await AtomicSwap.new(accounts[0]);
            const makerNoteValues = [10, 20];
            const takerNoteValues = [10, 20];
            testNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
        });

        it('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const makerNoteValues = [10, 50];
            const takerNoteValues = [20, 20];
            const unbalancedNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = atomicProof.constructAtomicSwap(unbalancedNotes, accounts[0]);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const makerNoteValues = [10, 20, 30];
            const takerNoteValues = [10, 20, 30];
            const tooManyNotes = atomicSwapHelpers.makeTestNotes(makerNoteValues, takerNoteValues);
            
            const { proofData, challenge } = atomicProof.constructAtomicSwap(tooManyNotes, accounts[0]);

            await exceptions.catchRevert(atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
