/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies

const {
    proof,
    abiEncoder,
    secp256k1,
    sign,
    note,
// eslint-disable-next-line import/no-unresolved
} = require('aztec.js');
const {
    constants: {
        CRS,
    },
} = require('@aztec/dev-utils');

const { joinSplit: aztecProof } = proof;
const { outputCoder, inputCoder } = abiEncoder;
const joinSplitEncode = inputCoder.joinSplit;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const NoteRegistry = artifacts.require('./contracts/ACE/NoteRegistry');

JoinSplit.abi = JoinSplitInterface.abi;


function encodeJoinSplitTransaction({
    inputNotes,
    outputNotes,
    senderAddress,
    inputNoteOwners,
    publicOwner,
    kPublic,
    validatorAddress,
}) {
    const m = inputNotes.length;
    const {
        proofData: proofDataRaw,
        challenge,
    } = aztecProof.constructJoinSplitModified([...inputNotes, ...outputNotes], m, senderAddress, kPublic, publicOwner);

    const inputSignatures = inputNotes.map((inputNote, index) => {
        const { privateKey } = inputNoteOwners[index];
        return sign.signACENote(
            proofDataRaw[index],
            challenge,
            senderAddress,
            validatorAddress,
            privateKey
        );
    });
    const outputOwners = outputNotes.map(n => n.owner);
    const proofData = joinSplitEncode(
        proofDataRaw,
        m,
        challenge,
        publicOwner,
        inputSignatures,
        outputOwners,
        outputNotes
    );
    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue: kPublic,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
}

contract('NoteRegistry', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let noteRegistry;
        let scalingFactor;
        const proofs = [];
        let proofOutputs = [];
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
            const aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(1, aztecJoinSplit.address, true);
            const publicOwner = accounts[0];
            proofs[0] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner,
                kPublic: -10,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[1] = encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[2] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[3] = encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: 40,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[4] = encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                validatorAddress: aztecJoinSplit.address,
            });
            proofs[5] = encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                validatorAddress: aztecJoinSplit.address,
            });

            erc20 = await ERC20Mintable.new();
            noteRegistry = await NoteRegistry.new(
                false,
                false,
                true,
                10,
                erc20.address,
                ace.address,
                accounts[0]
            );

            scalingFactor = new BN(10);
            await Promise.all(accounts.map(account => erc20.mint(
                account,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            )));
            await Promise.all(accounts.map(account => erc20.approve(
                noteRegistry.address,
                scalingFactor.mul(tokensTransferred),
                { from: account, gas: 4700000 }
            ))); // approving tokens
            proofOutputs = proofs.map(({ expectedOutput }) => outputCoder.getProofOutput(expectedOutput, 0));
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
        });

        it('will can update a note registry with output notes', async () => {
            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);
            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic negative', async () => {
            await ace.validateProof(1, accounts[0], proofs[0].proofData);
            await noteRegistry.updateNoteRegistry(`0x${proofOutputs[0].slice(0x40)}`, 1, accounts[0]);
            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[1].proofData);
            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);
            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('can update a note registry by consuming input notes, with kPublic positive', async () => {
            await ace.validateProof(1, accounts[0], proofs[2].proofData);
            await noteRegistry.updateNoteRegistry(`0x${proofOutputs[2].slice(0x40)}`, 1, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[3].proofData);
            const formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('can update a note registry with kPublic = 0', async () => {
            await ace.validateProof(1, accounts[0], proofs[4].proofData);
            await noteRegistry.updateNoteRegistry(`0x${proofOutputs[4].slice(0x40)}`, 1, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(1, accounts[0], proofs[5].proofData);
            const formattedProofOutput = `0x${proofOutputs[5].slice(0x40)}`;
            const { receipt: regReceipt } = await noteRegistry.updateNoteRegistry(formattedProofOutput, 1, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });
    });
});
