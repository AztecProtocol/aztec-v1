/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
const { constants } = require('@aztec/dev-utils');

const {
    proof: { privateRange },
    note,
    secp256k1,
} = require('aztec.js');

// ### Artifacts
const PrivateRange = artifacts.require('./PrivateRange');
const PrivateRangeInterface = artifacts.require('./PrivateRangeInterface');

PrivateRange.abi = PrivateRangeInterface.abi;

contract('PrivateRange', (accounts) => {
    let privateRangeContract;
    describe('Success States', () => {
        beforeEach(async () => {
            privateRangeContract = await PrivateRange.new({
                from: accounts[0],
            });
        });

        it.only('should validate encoding of a JOIN-SPLIT zero-knowledge proof', async () => {
            const noteValues = [10, 4, 6];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))];

            const originalNote = notes[0];
            const comparisonNote = notes[1];
            const utilityNote = notes[2];

            const { proofData } = privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                utilityNote,
                senderAddress: accounts[0],
            });

            const challenge = proofData.slice(0, 0x42);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);
            console.log('recovered challenge: ', result);

            expect(result).to.equal(challenge);
        });
    });

    describe('failure States', () => {
        beforeEach(async () => {
            privateRangeContract = await PrivateRange.new({
                from: accounts[0],
            });
        });

        it.only('should validate encoding of a JOIN-SPLIT zero-knowledge proof', async () => {
            const noteValues = [10, 5, 6];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))];

            const originalNote = notes[0];
            const comparisonNote = notes[1];
            const utilityNote = notes[2];

            const { proofData } = privateRange.encodePrivateRangeTransaction({
                originalNote,
                comparisonNote,
                utilityNote,
                senderAddress: accounts[0],
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });
    });
});
