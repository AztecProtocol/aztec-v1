/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');
const crypto = require('crypto');

// ### Internal Dependencies
const { constants } = require('@aztec/dev-utils');

const {
    proof: { privateRange },
    note,
    secp256k1,
    abiEncoder: { inputCoder },
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

        it('validate zk validator success', async () => {
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

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const result = await privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts);

            expect(result).to.equal(true);
        });
    });

    describe('failure States', () => {
        beforeEach(async () => {
            privateRangeContract = await PrivateRange.new({
                from: accounts[0],
            });
        });

        it('validate failure for incorrect balancing relation', async () => {
            const noteValues = [10, 20, 6];
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

        it('validate failure for fake challenge', async () => {
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

            const fakeChallenge = padLeft(crypto.randomBytes(32).toString('hex'), 64);
            const fakeProofData = `0x${proofData.slice(0x02, 0x42)}${fakeChallenge}${proofData.slice(0x82)}`;

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(
                privateRangeContract.validatePrivateRange(fakeProofData, accounts[0], constants.CRS, opts),
            );
        });

        it('validate failure for fake proof data', async () => {
            const noteValues = [10, 4, 6];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))];

            const originalNote = notes[0];
            const comparisonNote = notes[1];
            const utilityNote = notes[2];
            const senderAddress = accounts[0];

            const { challenge } = privateRange.constructProof([originalNote, comparisonNote, utilityNote], senderAddress);

            const inputNotes = [originalNote, comparisonNote];
            const outputNotes = [utilityNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwner = [utilityNote.owner];
            const fakeProofData = [...Array(4)].map(() =>
                [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
            );

            const proofData = inputCoder.privateRange(fakeProofData, challenge, inputOwners, outputOwner, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if points not on the curve', async () => {
            const noteValues = [10, 4, 6];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))];

            const originalNote = notes[0];
            const comparisonNote = notes[1];
            const utilityNote = notes[2];

            const inputNotes = [originalNote, comparisonNote];
            const outputNotes = [utilityNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwner = [utilityNote.owner];

            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const challengeString = `0x${padLeft(accounts[0].slice(2), 64)}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = sha3(challengeString, 'hex');

            const proofDataRaw = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwner, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });

        it('validate failure if scalars are zero', async () => {
            const noteValues = [10, 4, 6];
            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const notes = [...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))];

            const originalNote = notes[0];
            const comparisonNote = notes[1];
            const utilityNote = notes[2];
            const senderAddress = accounts[0];

            const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
                [originalNote, comparisonNote, utilityNote],
                senderAddress,
            );

            const inputNotes = [originalNote, comparisonNote];
            const outputNotes = [utilityNote];
            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwner = [utilityNote.owner];

            const scalarZeroProofData = proofDataRaw.map((proofElement) => {
                return [padLeft(0, 64), padLeft(0, 64), proofElement[2], proofElement[3], proofElement[4], proofElement[5]];
            });

            const proofData = inputCoder.privateRange(scalarZeroProofData, challenge, inputOwners, outputOwner, outputNotes);

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            await truffleAssert.reverts(privateRangeContract.validatePrivateRange(proofData, accounts[0], constants.CRS, opts));
        });
    });
});
