/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { BOGUS_PROOF, JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ERC20BrokenTransferTest = artifacts.require('./contracts/ERC20/ERC20BrokenTransferTest');
const ERC20BrokenTransferFromTest = artifacts.require('./contracts/ERC20/ERC20BrokenTransferFromTest');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');

contract('Note Registry', (accounts) => {
    let ace;
    let aztecAccounts = [];
    let aztecJoinSplit;
    const canAdjustSupply = false;
    const canConvert = true;
    let erc20;
    let notes = [];
    const proofs = [];
    let proofHashes = [];
    let proofOutputs = [];
    const scalingFactor = new BN(10);
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
        await ace.setCommonReferenceString(constants.CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
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

        erc20 = await ERC20Mintable.new();
        await ace.createNoteRegistry(
            erc20.address,
            scalingFactor,
            canAdjustSupply,
            canConvert,
            { from: accounts[0] }
        );

        await Promise.all(accounts.map(account => erc20.mint(
            account,
            scalingFactor.mul(tokensTransferred),
            { from: accounts[0], gas: 4700000 }
        )));
        await Promise.all(accounts.map(account => erc20.approve(
            ace.address, // address approving to spend
            scalingFactor.mul(tokensTransferred), // value to transfer
            { from: account, gas: 4700000 }
        )));


        proofOutputs = proofs.map(({ expectedOutput }) => {
            return outputCoder.getProofOutput(expectedOutput, 0);
        });
        proofHashes = proofOutputs.map((proofOutput) => {
            return outputCoder.hashProofOutput(proofOutput);
        });
    });

    describe('success states', async () => {
        beforeEach(async () => {
            await ace.publicApprove(
                accounts[0],
                proofHashes[0],
                10,
                { from: accounts[0] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[1],
                40,
                { from: accounts[1] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[2],
                130,
                { from: accounts[2] }
            );
            await ace.publicApprove(
                accounts[0],
                proofHashes[4],
                30,
                { from: accounts[3] }
            );
        });

        it('should be able to create a new note registry', async () => {
            const opts = { from: accounts[1] };
            const { receipt } = await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                opts
            );
            expect(receipt.status).to.equal(true);
        });

        it('should be able to read a registry from storage', async () => {
            const registry = await ace.getRegistry(accounts[0]);
            expect(registry.linkedToken).to.equal(erc20.address);
            expect(registry.scalingFactor.toString()).to.equal(scalingFactor.toString());
            expect(registry.totalSupply.toString()).to.equal('0');
            expect(registry.confidentialTotalMinted).to.equal(constants.ZERO_VALUE_NOTE_HASH);
            expect(registry.confidentialTotalBurned).to.equal(constants.ZERO_VALUE_NOTE_HASH);
            expect(registry.canConvert).to.equal(true);
            expect(registry.canAdjustSupply).to.equal(false);
        });

        it('should be able to read a note from storage', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const result = await ace.getNote(accounts[0], notes[0].noteHash);
            const block = await web3.eth.getBlock('latest');
            expect(result.status.toNumber()).to.equal(1);
            expect(result.createdOn.toString()).to.equal(block.timestamp.toString());
            expect(result.destroyedOn.toString()).to.equal('0');
            expect(result.noteOwner).to.equal(notes[0].owner);
        });

        it('should withdraw from the public erc20 contract ', async () => {
            const publicOwner = accounts[0];
            const previousTokenBalance = await erc20.balanceOf(publicOwner);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const tokenBalance = await erc20.balanceOf(publicOwner);
            const withdrawnAmount = new BN(10); // kPublic is -10
            const newBalance = previousTokenBalance.sub(withdrawnAmount.mul(scalingFactor));
            expect(tokenBalance.toString()).to.equal(newBalance.toString());
        });

        it('should deposit into the public erc20 contract ', async () => {
            const publicOwner = accounts[2];
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const previousTokenBalance = await erc20.balanceOf(publicOwner);

            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[3].proofData);
            formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const tokenBalance = await erc20.balanceOf(publicOwner);
            const withdrawnAmount = new BN(40); // kPublic is 40
            const newBalance = previousTokenBalance.add(withdrawnAmount.mul(scalingFactor));
            expect(tokenBalance.toString()).to.equal(newBalance.toString());
        });

        it('should update a note registry with output notes', async () => {
            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should put output notes in the registry', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
            const secondNote = await ace.getNote(accounts[0], notes[1].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        });

        it('should clear input notes from the registry', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            let firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
            let secondNote = await ace.getNote(accounts[0], notes[1].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);

            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[1].proofData);
            formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            firstNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
            secondNote = await ace.getNote(accounts[0], notes[0].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[1].proofData);
            formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic positive', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[3].proofData);
            formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[4].proofData);
            let formattedProofOutput = `0x${proofOutputs[4].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[5].proofData);
            formattedProofOutput = `0x${proofOutputs[5].slice(0x40)}`;
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });
    });

    describe('failure states', async () => {
        it('should fail to read a non-existent note', async () => {
            await truffleAssert.reverts(
                ace.getNote(accounts[1], notes[0].noteHash),
                'expected note to exist'
            );
        });

        it('should fail to read a non-existent registry', async () => {
            await truffleAssert.reverts(
                ace.getRegistry(accounts[1]),
                'expected registry to be created'
            );
        });

        it('should fail to create a note registry if sender already owns one', async () => {
            await truffleAssert.reverts(
                ace.createNoteRegistry(
                    erc20.address,
                    scalingFactor,
                    canAdjustSupply,
                    canConvert
                ),
                'address already has a linked note registry'
            );
        });

        it('should fail to create a note registry if linked token address is 0x0', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                ace.createNoteRegistry(
                    constants.addresses.ZERO_ADDRESS,
                    scalingFactor,
                    canAdjustSupply,
                    canConvert,
                    opts
                ),
                'expected the linked token address to exist'
            );
        });

        it('should fail to public approve tokens if no registry exists for the given address', async () => {
            const publicValue = 10;
            await truffleAssert.reverts(
                ace.publicApprove(
                    accounts[1],
                    proofHashes[0],
                    publicValue
                ),
                'note registry does not exist'
            );
        });

        it('should fail to update a note registry if no registry exists for the given address', async () => {
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0], opts),
                'note registry does not exist for the given address'
            );
        });

        it('should fail to update a note registry if proof output is malformed', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const malformedProofOutput = `0x${proofOutputs[0].slice(0x05)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, malformedProofOutput, accounts[0]),
                'ACE has not validated a matching proof'
            );
        });

        it('should fail to update a note registry if proof is not valid', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(BOGUS_PROOF, formattedProofOutput, accounts[0]),
                'ACE has not validated a matching proof'
            );
        });

        it('should fail to update a note registry if proof sender is different', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[1]),
                'ACE has not validated a matching proof'
            );
        });

        it('should fail to update a note registry is public value is non-zero and conversion is deactivated', async () => {
            const canConvertFlag = false;
            const opts = { from: accounts[1] };
            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvertFlag,
                opts
            );
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0], opts),
                'asset cannot be converted into public tokens'
            );
        });

        it('should fail to update a note registry if public approval value is insufficient', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            await ace.publicApprove(
                accounts[0],
                proofHashes[0],
                5 // kPublic is -10
            );
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]),
                'public owner has not validated a transfer of tokens'
            );
        });

        it('should fail to update a note registry if the erc20 transferFrom fails', async () => {
            const opts = { from: accounts[1] };
            const erc20BrokenTransferFromTest = await ERC20BrokenTransferFromTest.new();
            await erc20BrokenTransferFromTest.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            await erc20BrokenTransferFromTest.approve(ace.address, scalingFactor.mul(tokensTransferred));
            await ace.createNoteRegistry(
                erc20BrokenTransferFromTest.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                opts
            );

            await ace.publicApprove(accounts[1], proofHashes[0], 10);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData, opts);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[1], opts),
                'you shall not pass'
            );
        });

        it('should fail to update a note registry if the erc20 transfer fails', async () => {
            const opts = { from: accounts[2] };
            const erc20BrokenTransferTest = await ERC20BrokenTransferTest.new();
            await erc20BrokenTransferTest.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            await erc20BrokenTransferTest.mint(accounts[2], scalingFactor.mul(tokensTransferred));
            await erc20BrokenTransferTest.approve(ace.address, scalingFactor.mul(tokensTransferred));
            await erc20BrokenTransferTest.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);

            await ace.createNoteRegistry(
                erc20BrokenTransferTest.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                opts
            );
            await ace.publicApprove(accounts[2], proofHashes[2], 130, opts);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData, opts);
            let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[2], opts);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[3].proofData, opts);
            formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[2], opts),
                'you shall not pass'
            );
        });

        it('should fail to update a note registry if input notes do not exist in the registry', async () => {
            await ace.publicApprove(accounts[0], proofHashes[1], 10);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[1].proofData);
            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]),
                'input note status is not UNSPENT'
            );
        });

        it('should fail to update a note registry if output notes already exist in the registry', async () => {
            await ace.publicApprove(accounts[0], proofHashes[0], 10);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[0].proofData);
            let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]);

            proofs[6] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: aztecJoinSplit.address,
            });
            proofOutputs[6] = outputCoder.getProofOutput(proofs[6].expectedOutput, 0);
            proofHashes[6] = outputCoder.hashProofOutput(proofOutputs[6]);

            await ace.publicApprove(accounts[0], proofHashes[6], 10);
            await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[6].proofData);
            formattedProofOutput = `0x${proofOutputs[6].slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]),
                'output note exists'
            );
        });
    });
});
