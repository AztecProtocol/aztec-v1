/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const {
    abiEncoder,
    params: { t2 },
    note,
    proof,
    secp256k1,
// eslint-disable-next-line import/no-unresolved
} = require('aztecJoinSplit.js');

const { outputCoder } = abiEncoder;

const fakeNetworkId = 100;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AZTECJoinSplit = artifacts.require('./contracts/ACE/validators/AZTECJoinSplit');
const AZTECInterface = artifacts.require('./contracts/ACE/validators/AZTECJoinSplitInterface');
const ZKERC20Contract = artifacts.require('./contracts/ZKERC20/ZKERC20');
const NoteRegistry = artifacts.require('./contracts/ACE/NoteRegistry');

AZTECJoinSplit.abi = AZTECInterface.abi;

const hx = new BN('7673901602397024137095011250362199966051872585513276903826533215767972925880', 10);
const hy = new BN('8489654445897228341090914135473290831551238522473825886865492707826370766375', 10);

contract('ZKERC20', (accounts) => {
    describe('success states', () => {
        let crs;
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let ZKERC20;
        let scalingFactor;
        let aztecJoinSplit;
        let noteRegistryAddress;
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
            crs = [
                `0x${padLeft(hx.toString(16), 64)}`,
                `0x${padLeft(hy.toString(16), 64)}`,
                ...t2,
            ];
            await ace.setCommonReferenceString(crs);
            aztecJoinSplit = await AZTECJoinSplit.new(fakeNetworkId);
            await ace.setProof(1, aztecJoinSplit.address, true);

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                aztecAddress: aztecJoinSplit.address,
            });
            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                aztecAddress: aztecJoinSplit.address,
            });
            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                aztecAddress: aztecJoinSplit.address,
            });
            proofs[3] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: 40,
                aztecAddress: aztecJoinSplit.address,
            });
            proofs[4] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                aztecAddress: aztecJoinSplit.address,
            });
            proofs[5] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                aztecAddress: aztecJoinSplit.address,
            });

            erc20 = await ERC20Mintable.new();

            ZKERC20 = await ZKERC20Contract.new(
                'Cocoa',
                false,
                false,
                true,
                10,
                erc20.address,
                ace.address
            );

            noteRegistryAddress = await ZKERC20.noteRegistry();
            const noteRegistry = await NoteRegistry.at(noteRegistryAddress);
            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                noteRegistryAddress,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
            const proofOutputs = proofs.map(({ expectedOutput }) => outputCoder.getProofOutput(expectedOutput, 0));
            const proofHashes = proofOutputs.map(proofOutput => outputCoder.hashProofOutput(proofOutput));
            await noteRegistry.publicApprove(
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await noteRegistry.publicApprove(
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await noteRegistry.publicApprove(
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await noteRegistry.publicApprove(
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
            await Promise.all(accounts.map(account => noteRegistry.publicApprove(
                noteRegistryAddress,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
        });

        it('will can update a note registry with output notes', async () => {
            // const { receipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const { receipt } = await ZKERC20.confidentialTransfer(proofs[0].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic negative', async () => {
            await ZKERC20.confidentialTransfer(proofs[0].proofData);
            const { receipt } = await ZKERC20.confidentialTransfer(proofs[1].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic positive', async () => {
            await ZKERC20.confidentialTransfer(proofs[2].proofData);
            const { receipt } = await ZKERC20.confidentialTransfer(proofs[3].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('can update a note registry with kPublic = 0', async () => {
            await ZKERC20.confidentialTransfer(proofs[4].proofData);
            const { receipt } = await ZKERC20.confidentialTransfer(proofs[5].proofData);
            expect(receipt.status).to.equal(true);
        });
    });
});
