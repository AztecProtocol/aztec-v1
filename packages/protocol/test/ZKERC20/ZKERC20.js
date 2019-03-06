/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
const {
    abiEncoder,
    note,
    proof,
    secp256k1,
// eslint-disable-next-line import/no-unresolved
} = require('aztec.js');
const {
    constants: {
        CRS,
    },
} = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZKERC20 = artifacts.require('./contracts/ZKERC20/ZKERC20');


JoinSplit.abi = JoinSplitInterface.abi;

contract('ZKERC20', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let zkerc20;
        let scalingFactor;
        let aztecJoinSplit;
        const proofs = [];
        const tokensTransferred = new BN(100000);

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(CRS);
            aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(1, aztecJoinSplit.address);

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[3] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: 40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[4] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[5] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                validatorAddress: aztecJoinSplit.address,
            });

            const proofOutputs = proofs.map(({ expectedOutput }) => {
                return outputCoder.getProofOutput(expectedOutput, 0);
            });
            const proofHashes = proofOutputs.map((proofOutput) => {
                return outputCoder.hashProofOutput(proofOutput);
            });

            erc20 = await ERC20Mintable.new();
            zkerc20 = await ZKERC20.new(
                'Cocoa',
                false,
                false,
                true,
                10,
                erc20.address,
                ace.address
            );

            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            )));
            // approving tokens
            await ace.publicApprove(
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await ace.publicApprove(
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await ace.publicApprove(
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await ace.publicApprove(
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
        });

        it('will can update a note registry with output notes', async () => {
            // const { receipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[0].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic negative', async () => {
            await zkerc20.confidentialTransfer(proofs[0].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[1].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic positive', async () => {
            await zkerc20.confidentialTransfer(proofs[2].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[3].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry with kPublic = 0', async () => {
            await zkerc20.confidentialTransfer(proofs[4].proofData);
            const { receipt } = await zkerc20.confidentialTransfer(proofs[5].proofData);
            expect(receipt.status).to.equal(true);
        });
    });
});
