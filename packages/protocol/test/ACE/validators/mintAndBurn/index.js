/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const {
    secp256k1,
    note,
    proof: { mint, burn },
    abiEncoder: { outputCoder },
} = require('aztec.js');

const { constants, exceptions } = require('@aztec/dev-utils');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');


// ### Artifacts
const AdjustSupply = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply/AdjustSupplyInterface');

AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('AdjustSupply', (accounts) => {
    let adjustSupplyContract;
    describe('success states', () => {
        beforeEach(async () => {
            adjustSupplyContract = await AdjustSupply.new({
                from: accounts[0],
            });
        });

        it('successfully validates encoding of a mint proof zero-knowledge proof', async () => {
            const noteValues = [50, 30, 10, 10];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());

            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes.slice(0, 1);
            const oldTotalMinted = notes.slice(1, 2);
            const adjustedNotes = notes.slice(2, 4);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const result = await adjustSupplyContract.validateAdjustSupply(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            // First proofOutput object (1 input note, 1 output note)
            expect(decoded[0].outputNotes[0].gamma.eq(newTotalMinted[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(newTotalMinted[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(newTotalMinted[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(newTotalMinted[0].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(oldTotalMinted[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(oldTotalMinted[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(oldTotalMinted[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(oldTotalMinted[0].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(publicValue);

            // Second proofOutput object (there are 2 notes being minted)
            expect(decoded[1].outputNotes[0].gamma.eq(adjustedNotes[0].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(adjustedNotes[0].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(adjustedNotes[0].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(adjustedNotes[0].owner.toLowerCase());

            expect(decoded[1].outputNotes[1].gamma.eq(adjustedNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[1].sigma.eq(adjustedNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[1].noteHash).to.equal(adjustedNotes[1].noteHash);
            expect(decoded[1].outputNotes[1].owner).to.equal(adjustedNotes[1].owner.toLowerCase());

            expect(decoded[1].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[1].publicValue).to.equal(publicValue);
            expect(result).to.equal(expectedOutput);


            const gasUsed = await adjustSupplyContract.validateAdjustSupply.estimateGas(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });


        it('validates that large numbers of input/output notes work', async () => {
            const noteValues = [80, 30, 10, 10, 10, 10, 10];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes.slice(0, 1);
            const oldTotalMinted = notes.slice(1, 2);
            const adjustedNotes = notes.slice(2, 7);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };

            const result = await adjustSupplyContract.validateAdjustSupply(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);

            const gasUsed = await adjustSupplyContract.validateAdjustSupply.estimateGas(proofData, senderAddress, constants.CRS, opts);
            console.log('gas used = ', gasUsed);
        });

        it('validate that minted notes of zero value work', async () => {
            const noteValues = [50, 30, 0, 20];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes.slice(0, 1);
            const oldTotalMinted = notes.slice(1, 2);
            const adjustedNotes = notes.slice(2, 4);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const opts = {
                from: senderAddress,
                gas: 4000000,
            };
            const result = await adjustSupplyContract.validateAdjustSupply(proofData, senderAddress, constants.CRS, opts);
            expect(result).to.equal(expectedOutput);

            const gasUsed = await adjustSupplyContract.validateAdjustSupply.estimateGas(proofData, senderAddress, constants.CRS, opts);
            console.log('gas used = ', gasUsed);
        });
    });

    describe('failure states', () => {
        beforeEach(async () => {
            adjustSupplyContract = await AdjustSupply.new({
                from: accounts[0],
            });
        });

        it('validates failure for unbalanced input/output notes', async () => {
            const noteValues = [50, 30, 40, 10];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes.slice(0, 1);
            const oldTotalMinted = notes.slice(1, 2);
            const adjustedNotes = notes.slice(2, 4);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;
            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(adjustSupplyContract.validateAdjustSupply(proofData, senderAddress, constants.CRS, opts));
        });

        it('validates failure when using a fake challenge and fake proof data', async () => {
            const noteValues = [50, 30, 10, 10];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes.slice(0, 1);
            const oldTotalMinted = notes.slice(1, 2);
            const adjustedNotes = notes.slice(2, 4);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;
            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(adjustSupplyContract.validateAdjustSupply(fakeProofData, senderAddress, constants.CRS, opts));
        });
    });
});
