/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');
const secp256k1 = require('@aztec/secp256k1');
const { constants } = require('@aztec/dev-utils');

// ### Internal Dependencies

const {
    proof: { joinSplit, proofUtils },
    note,
    abiEncoder: { outputCoder },
} = require('aztec.js');

// ### Artifacts
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');

JoinSplit.abi = JoinSplitInterface.abi;

contract.only('JoinSplit signature flow tests', (accounts) => {
    // Tests to confirm no signature validation is performed in the JoinSplit.sol
    // validator
    let joinSplitContract;
    describe('Success States', () => {
        beforeEach(async () => {
            joinSplitContract = await JoinSplit.new({
                from: accounts[0],
            });
        });

        it('succeeds for wrong input note owners', async () => {
            const aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            const { publicKey } = aztecAccounts[0];
            const { address: address2 } = aztecAccounts[1];

            const note1Value = 20;
            const note2Value = 50;
            const note3Value = 30;

            const note1 = await note.create(publicKey, note1Value, address2);
            const note2 = await note.create(publicKey, note2Value, address2);
            const note3 = await note.create(publicKey, note3Value);

            const kPublic = 0;
            const randomAddress = proofUtils.randomAddress();

            const { proofData, expectedOutput } = joinSplit.encodeJoinSplitTransaction({
                inputNotes: [note2],
                outputNotes: [note3, note1],
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(4, 5), // incorrect account
                publicOwner: accounts[3],
                kPublic,
                validatorAddress: randomAddress,
            });

            const opts = {
                from: accounts[0],
                gas: 4000000,
            };

            const publicOwner = accounts[3];

            const result = await joinSplitContract.validateJoinSplit(proofData, accounts[0], constants.CRS, opts);

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            expect(decoded[0].outputNotes[0].gamma.eq(note3.gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(note3.sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(note3.noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(note3.owner.toLowerCase());
            expect(decoded[0].outputNotes[1].gamma.eq(note1.gamma)).to.equal(true);
            expect(decoded[0].outputNotes[1].sigma.eq(note1.sigma)).to.equal(true);
            expect(decoded[0].outputNotes[1].noteHash).to.equal(note1.noteHash);
            expect(decoded[0].outputNotes[1].owner).to.equal(note1.owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(note2.gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(note2.sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(note2.noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(note2.owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(kPublic);
            expect(result).to.equal(expectedOutput);
            expect(result).to.equal(expectedOutput);
        });
    });
});
