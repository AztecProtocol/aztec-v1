/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');


// ### Internal Dependencies
const aztec = require('aztec.js');
const { params: { t2, GROUP_MODULUS } } = require('aztec.js');
const { exceptions } = require('@aztec/dev-utils');

const { K_MAX } = aztec.params;


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

function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}


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
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(testNotes, accounts[0]);
            const result = aztec.proof.bilateralSwap.verifier.verifyProof(proofData, challenge, accounts[0]);
            expect(result).to.equal(true);
        });

        it('validate that the smart contract can verify the bilateral swap proof', async () => {
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(testNotes, accounts[0]);

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

        it('validate success when one note pair has values of 0 (e.g. k_1 = k_3 = 0)', async () => {
            const singleZeroNotePair = aztec.proof.bilateralSwap.helpers.makeTestNotes([0, 20], [0, 20]);

            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(singleZeroNotePair, accounts[0]);

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

        it('validate success when both note pairs have values of 0 (e.g. k_1 = k_3 = 0 AND k_2 = k_4 = 0)', async () => {
            const bothZeroNotePair = aztec.proof.bilateralSwap.helpers.makeTestNotes([0, 20], [0, 20]);

            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(bothZeroNotePair, accounts[0]);

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

            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(
                incorrectTestNoteValues,
                accounts[0]
            );

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validate failure for random note values between [0,...,K_MAX]', async () => {
            const makerNoteValues = [generateNoteValue(), generateNoteValue()];
            const takerNoteValues = [generateNoteValue(), generateNoteValue()];

            const randomNoteValues = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);

            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(
                randomNoteValues,
                accounts[0]
            );

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for incorrect number of input notes', async () => {
            const makerNoteValues = [10, 20, 30];
            const takerNoteValues = [10, 20, 30];
            const incorrectNumberOfNotes = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);

            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(
                incorrectNumberOfNotes,
                accounts[0]
            );

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for a bid note of zero value', async () => {
            const makerNoteValues = [0, 20];
            const takerNoteValues = [10, 20];
            const NotesWithAZero = aztec.proof.bilateralSwap.helpers.makeTestNotes(makerNoteValues, takerNoteValues);
            const { proofData, challenge } = aztec.proof.bilateralSwap.constructProof(NotesWithAZero, accounts[0]);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using a fake challenge', async () => {
            const { proofData } = aztec.proof.bilateralSwap.constructProof(testNotes, accounts[0]);

            const fakeChallenge = new BN(crypto.randomBytes(32), 16).umod(GROUP_MODULUS).toString(10);

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, fakeChallenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure for using fake proof data', async () => {
            // this test doesn't work at the moment
            const { challenge } = aztec.proof.bilateralSwap.constructProof(testNotes, accounts[0]);

            const fakeProofData = [...new Array(4)].map(
                () => [...new Array(6)].map(
                    () => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`
                )
            );
            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(fakeProofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('Validate failure when points not on curve', async () => {
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce(acc => `${acc}${zeroes}`, '');
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');

            const proofData = [...new Array(4)].map(
                () => [...new Array(6)].map(
                    () => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`
                )
            );
            // Making the kBars satisfy the proof relation, to ensure it's not an incorrect
            // balancing relationship that causes the test to fail
            proofData[0][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_1
            proofData[1][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_2
            proofData[2][0] = '0x1000000000000000000000000000000000000000000000000000000000000000'; // k_3
            proofData[3][0] = '0x2000000000000000000000000000000000000000000000000000000000000000'; // k_4

            await exceptions.catchRevert(bilateralSwapContract.validateBilateralSwap(proofData, challenge, t2, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
