/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { padLeft, sha3 } = require('web3-utils');

// ### Internal Dependencies
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');

const {
    proof: { joinSplit },
    note,
    secp256k1,
} = require('aztec.js');

// ### Artifacts
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');

JoinSplit.abi = JoinSplitInterface.abi;

contract('JoinSplit alternative flow test', (accounts) => {
    let joinSplitContract;
    // Creating a collection of tests that should pass
    describe('Success States', () => {
        beforeEach(async () => {
            joinSplitContract = await JoinSplit.new({
                from: accounts[0],
            });

        });

        it('should validate encoding of a JOIN-SPLIT zero-knowledge proof', async () => {
            const aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            const { publicKey } = aztecAccounts[0];
            const { address: address2 } = aztecAccounts[1];

            const note1Value = 20;
            const note2Value = 50;
            const note3Value = 30;


            // TODO sort values of notes and owners
            const note1 = await note.create(publicKey, note1Value, address2); // changeNote (50)
            const note2 = await note.create(publicKey, note2Value, address2); // currentInterestBalance (20)
            const note3 = await note.create(publicKey, note3Value); // withdrawInterestNote (30)

            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes: [note2],
                outputNotes: [note3, note1],
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(4, 5),// TODO: sort joinsplit proof construction, so don't need private key,
                publicOwner: accounts[3],
                kPublic: 0,
                validatorAddress: joinSplitContract.address,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            // TODO: make work without signatures
            const result = await joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, opts);

            console.log('result: ', result)
            // expect(result).to.equal(expectedOutput);
        });
    });
});
