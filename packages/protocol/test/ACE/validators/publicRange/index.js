/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies


// ### Internal Dependencies
const {
    secp256k1,
    note,
    proof: { publicRange },
} = require('aztec.js');
const { constants } = require('@aztec/dev-utils');

// ### Artifacts

const PublicRange = artifacts.require('./PublicRange');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface');

PublicRange.abi = PublicRangeInterface.abi;


contract.only('Public range proof tests', (accounts) => {
    let publicRangeContract;
    describe('Success States', () => {
        beforeEach(async () => {
            publicRangeContract = await PublicRange.new({
                from: accounts[0],
            });

            publicRangeContract = await PublicRange.new({
                from: accounts[0],
            });
        });

        it('validate public range proof using JavaScript validator', async () => {
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

        it.only('should validate encoding of a public range zero-knowledge proof', async () => {
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

            const { proofData, challenge } = publicRange.encodePublicRangeTransaction({
                inputNotes,
                outputNotes,
                u,
                senderAddress,
            });


            const result = await publicRangeContract.validatePublicRange(proofData, accounts[0], constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('original challenge: ', challenge);
            console.log('recovered challenge: ', result);
            expect(result).to.equal(challenge);
        });
    });
});