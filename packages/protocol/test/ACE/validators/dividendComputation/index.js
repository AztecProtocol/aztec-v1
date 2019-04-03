/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');

// ### Internal Dependencies
const {
    proof: { dividendComputation, proofUtils },
    abiEncoder: { inputCoder, outputCoder },
    note,
    secp256k1,
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');


// ### Artifacts
const dividend = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputation');
const dividendInterface = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputationInterface');

dividend.abi = dividendInterface.abi;

contract('Dividend Computation', (accounts) => {
    let dividendContract;
    describe('success states', () => {
        let dividendAccounts = [];

        beforeEach(async () => {
            dividendContract = await dividend.new({
                from: accounts[0],
            });
            dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
        });

        it('successfully validates output coding of AZTEC dividend computation zero-knowledge proof', async () => {
            const noteValues = [90, 4, 50];
            const za = 100;
            const zb = 5;

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);

            const { proofData, expectedOutput } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress: accounts[0],
            });

            const publicOwner = '0x0000000000000000000000000000000000000000';

            const result = await dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );

            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[1].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[1].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[1].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[0].outputNotes[1].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(result).to.equal(expectedOutput);

            const gasUsed = await dividendContract.validateDividendComputation.estimateGas(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });

        /*
        it.only('validate a proof that uses notes worth 0', async () => {
            const noteValues = [0, 20, 0, 20];

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
            });

            const result = await dividendContract.validateBilateralSwap(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            expect(result).to.equal(expectedOutput);
        });
        */
    });

    describe('failure states', () => {
        beforeEach(async () => {
            dividendContract = await dividend.new(accounts[0]);
        });

        it('validate failure for residual commitment message that does not satisfy proof relation', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 3, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure when using a fake challenge', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            await truffleAssert.reverts(dividendContract.validateDividendComputation(fakeProofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for random proof data', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];


            const {
                challenge,
            } = dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, senderAddress);

            const inputOwners = [...inputNotes.map(m => m.owner)];
            const outputOwners = [...outputNotes.map(n => n.owner)];

            const fakeProofData = [...Array(4)]
                .map(() => [...Array(6)]
                    .map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`));

            const proofData = inputCoder.dividendComputation(
                fakeProofData,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero input note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [0, 4, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero output note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 0];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for zero residual note value', async () => {
            const za = 100;
            const zb = 5;
            const noteValues = [90, 0, 50];

            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });

        it('validates failure for z_a, z_b > kMax', async () => {
            // TODO: Fix this test - doesn't work when submitting za, zb > K_MAX
            // get an invalid bytes value
            const za = 100;
            const zb = 5;
            const noteValues = [90, 4, 50];

            const zaHigh = constants.K_MAX + za;
            const zbHigh = constants.K_MAX + zb;

            console.log('zaHigh: ', zaHigh);
            console.log('K_MAX: ', constants.K_MAX);
            console.log('za: ', za);


            const dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());

            const notes = [
                ...dividendAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ];

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];

            const { proofData } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                zaHigh,
                zbHigh,
                senderAddress,
            });

            await truffleAssert.reverts(dividendContract.validateDividendComputation(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            }));
        });
    });
});
