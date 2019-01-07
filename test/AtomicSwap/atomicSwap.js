/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');

// ### Internal Dependencies
const { t2, GROUP_MODULUS } = require('../../aztec-crypto-js/params');
const secp256k1 = require('../../aztec-crypto-js/secp256k1/secp256k1');
const notes = require('../../aztec-crypto-js/note/note');
const atomicProof = require('../../aztec-crypto-js/proof/atomicSwapProof');

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

contract('AtomicSwap', (accounts) => {
    describe('success states', () => {
        let atomicSwap;
        let testNotes;

        beforeEach(async () => {
            atomicSwap = await AtomicSwap.new(accounts[0]);

            const spendingKeys = [
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
            ];

            const noteValues = [10, 20, 10, 20];

            testNotes = {
                makerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[0].getPublic(true, 'hex')}`, noteValues[0]),
                    askNote: notes.create(`0x${spendingKeys[1].getPublic(true, 'hex')}`, noteValues[1]),
                },
                takerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[2].getPublic(true, 'hex')}`, noteValues[2]),
                    askNote: notes.create(`0x${spendingKeys[3].getPublic(true, 'hex')}`, noteValues[3]),
                },
            };
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

            const spendingKeys = [
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
            ];

            const noteValues = [10, 20, 10, 20];

            testNotes = {
                makerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[0].getPublic(true, 'hex')}`, noteValues[0]),
                    askNote: notes.create(`0x${spendingKeys[1].getPublic(true, 'hex')}`, noteValues[1]),
                },
                takerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[2].getPublic(true, 'hex')}`, noteValues[2]),
                    askNote: notes.create(`0x${spendingKeys[3].getPublic(true, 'hex')}`, noteValues[3]),
                },
            };
        });

        it.only('Validate failure for incorrect input note values (k1 != k3, k2 != k4)', async () => {
            const incorrectNoteValues = [10, 50, 20, 20];

            const spendingKeys = [
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
            ];

            const unbalancedNotes = {
                makerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[0].getPublic(true, 'hex')}`, incorrectNoteValues[0]),
                    askNote: notes.create(`0x${spendingKeys[1].getPublic(true, 'hex')}`, incorrectNoteValues[1]),
                },
                takerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[2].getPublic(true, 'hex')}`, incorrectNoteValues[2]),
                    askNote: notes.create(`0x${spendingKeys[3].getPublic(true, 'hex')}`, incorrectNoteValues[3]),
                },
            };

            const { proofData, challenge } = atomicProof.constructAtomicSwap(unbalancedNotes, accounts[0]);

            const result = await atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });
            expect(result).to.equal(false);
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const noteValues = [10, 20, 30, 10, 20, 30];

            const spendingKeys = [
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
                secp256k1.keyFromPrivate(crypto.randomBytes(32)),
            ];

            const tooManyNotes = {
                makerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[0].getPublic(true, 'hex')}`, noteValues[0]),
                    askNote: notes.create(`0x${spendingKeys[1].getPublic(true, 'hex')}`, noteValues[1]),
                    extraNote: notes.create(`0x${spendingKeys[2].getPublic(true, 'hex')}`, noteValues[2]),

                },
                takerNotes: {
                    bidNote: notes.create(`0x${spendingKeys[3].getPublic(true, 'hex')}`, noteValues[3]),
                    askNote: notes.create(`0x${spendingKeys[4].getPublic(true, 'hex')}`, noteValues[4]),
                    extraNote: notes.create(`0x${spendingKeys[5].getPublic(true, 'hex')}`, noteValues[5]),
                },
            };
            
            const { proofData, challenge } = atomicProof.constructIncorrectAtomicSwap(tooManyNotes, accounts[0]);
            console.log('proof data: ', proofData);

            const result = await atomicSwap.validateAtomicSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('result: ', result);
            expect(result).to.equal(false);
        });
    });
});
