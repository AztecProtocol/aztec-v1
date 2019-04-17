/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies


// ### Internal Dependencies
const {
    secp256k1,
    note,
    proof: { publicRange },
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');


// ### Artifacts

const PublicRange = artifacts.require('./PublicRange');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface');

PublicRange.abi = PublicRangeInterface.abi;


contract('Public range proof tests', (accounts) => {
    let publicRangeContract;
    describe('Success States', () => {
        beforeEach(async () => {
            publicRangeContract = await PublicRange.new({
                from: accounts[0],
            });
        });

        it('validate success when using JavaScript validator', async () => {
            const noteValues = [50, 40];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const u = 10;
            const senderAddress = accounts[0];

            const { proofData, challenge } = publicRange.constructProof([...inputNotes, ...outputNotes], u, senderAddress);
            const { valid } = publicRange.verifier.verifyProof(proofData, challenge, senderAddress, u);
            expect(valid).to.equal(true);
        });

        it('validate success when using zk validator contract', async () => {
            const noteValues = [50, 40];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const u = 10;
            const senderAddress = accounts[0];

            const { proofData } = publicRange.encodePublicRangeTransaction({
                inputNotes,
                outputNotes,
                u,
                senderAddress,
            });


            const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            expect(result).to.equal(true)
        });

        it('validate success when public integer equals the note value', async () => {
            const noteValues = [10, 0];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const u = 10;
            const senderAddress = accounts[0];

            const { proofData } = publicRange.encodePublicRangeTransaction({
                inputNotes,
                outputNotes,
                u,
                senderAddress,
            });

            const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            expect(result).to.equal(true)
        });
    });

    describe('Failure States', () => {
        beforeEach(async () => {
            publicRangeContract = await PublicRange.new({
                from: accounts[0],
            });
        });

        it('validate failure when balancing relationship not held', async () => {
            const noteValues = [50, 41];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const u = 10;
            const senderAddress = accounts[0];

            const { proofData } = publicRange.encodePublicRangeTransaction({
                inputNotes,
                outputNotes,
                u,
                senderAddress,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(
                publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
            );
        });

        it('validate failure when note value is less than public integer', async () => {
            const noteValues = [9, -1];
            const numNotes = noteValues.length;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 2);
            const u = 10;
            const senderAddress = accounts[0];

            const { proofData } = publicRange.encodePublicRangeTransaction({
                inputNotes,
                outputNotes,
                u,
                senderAddress,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };
            await truffleAssert.reverts(
                publicRangeContract.validatePublicRange(proofData, senderAddress, constants.CRS, opts),
            );
        });
    });
});