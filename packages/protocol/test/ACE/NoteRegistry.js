/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
const { encoder, JoinSplitProof, note } = require('aztec.js');
const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const ACE = artifacts.require('./ACE');
const ERC20BrokenTransferTest = artifacts.require('./ERC20BrokenTransferTest');
const ERC20BrokenTransferFromTest = artifacts.require('./ERC20BrokenTransferFromTest');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplit = artifacts.require('./JoinSplit');

let ace;
const aztecAccount = secp256k1.generateAccount();
const { BOGUS_PROOF, JOIN_SPLIT_PROOF } = proofs;
const canAdjustSupply = false;
const canConvert = true;
let erc20;
let joinSplitValidator;
const scalingFactor = new BN(10);
const tokensTransferred = new BN(100000);

const getNotes = async (inputNoteValues = [], outputNoteValues = []) => {
    const inputNotes = await Promise.all(
        inputNoteValues.map((inputNoteValue) => note.create(aztecAccount.publicKey, inputNoteValue)),
    );
    const outputNotes = await Promise.all(
        outputNoteValues.map((outputNoteValue) => note.create(aztecAccount.publicKey, outputNoteValue)),
    );
    return { inputNotes, outputNotes };
};

const getDefaultNotes = async () => {
    const inputNoteValues = [10, 10];
    const outputNoteValues = [20, 20];
    const publicValue = -20;
    const { inputNotes, outputNotes } = await getNotes(inputNoteValues, outputNoteValues);
    return { inputNotes, outputNotes, publicValue };
};

contract('NoteRegistry', (accounts) => {
    let inputNotes;
    let outputNotes;
    let proof;
    const publicOwner = accounts[0];
    let publicValue;
    const sender = accounts[0];

    beforeEach(async () => {
        ace = await ACE.new({ from: sender });
        joinSplitValidator = await JoinSplit.new();
        erc20 = await ERC20Mintable.new();
        await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await erc20.mint(sender, scalingFactor.mul(tokensTransferred));
        await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));
        ({ inputNotes, outputNotes, publicValue } = await getDefaultNotes());
        proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
    });

    describe('Success States', async () => {
        beforeEach(async () => {
            await ace.publicApprove(sender, proof.hash, 10);
        });

        it('should be able to create a new note registry', async () => {
            const opts = { from: accounts[1] };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            expect(receipt.status).to.equal(true);
        });

        it('should be able to read a registry from storage', async () => {
            const registry = await ace.getRegistry(sender);
            expect(registry.canAdjustSupply).to.equal(false);
            expect(registry.canConvert).to.equal(true);
            expect(registry.confidentialTotalBurned).to.equal(constants.ZERO_VALUE_NOTE_HASH);
            expect(registry.confidentialTotalMinted).to.equal(constants.ZERO_VALUE_NOTE_HASH);
            expect(registry.linkedToken).to.equal(erc20.address);
            expect(registry.scalingFactor.toString()).to.equal(scalingFactor.toString());
            expect(registry.totalSupply.toString()).to.equal('0');
        });

        it('should be able to read a note from storage', async () => {
            const data = proof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

            const result = await ace.getNote(sender, inputNotes[0].noteHash);
            const block = await web3.eth.getBlock('latest');
            expect(result.status.toNumber()).to.equal(1);
            expect(result.createdOn.toString()).to.equal(block.timestamp.toString());
            expect(result.destroyedOn.toString()).to.equal('0');
            expect(result.noteOwner).to.equal(inputNotes[0].owner);
        });

        // it('should withdraw from the public erc20 contract ', async () => {
        //     const previousTokenBalance = await erc20.balanceOf(publicOwner);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData);
        //     const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     const tokenBalance = await erc20.balanceOf(publicOwner);
        //     const withdrawnAmount = new BN(10); // kPublic is -10
        //     const newBalance = previousTokenBalance.sub(withdrawnAmount.mul(scalingFactor));
        //     expect(tokenBalance.toString()).to.equal(newBalance.toString());
        // });

        // it('should deposit into the public erc20 contract ', async () => {
        //     const publicOwner = accounts[2];
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[2].proofData);
        //     let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     const previousTokenBalance = await erc20.balanceOf(publicOwner);

        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[3].proofData);
        //     formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     const tokenBalance = await erc20.balanceOf(publicOwner);
        //     const withdrawnAmount = new BN(40); // kPublic is 40
        //     const newBalance = previousTokenBalance.add(withdrawnAmount.mul(scalingFactor));
        //     expect(tokenBalance.toString()).to.equal(newBalance.toString());
        // });

        it('should update a note registry with output notes', async () => {
            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData);
            const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

            expect(aceReceipt.status).to.equal(true);
            expect(regReceipt.status).to.equal(true);
        });

        it('should put output notes in the registry', async () => {
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData);
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

            const firstNote = await ace.getNote(sender, inputNotes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
            const secondNote = await ace.getNote(sender, inputNotes[1].noteHash);
            expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        });

        // it('should clear input notes from the registry', async () => {
        //     const data = proof.encodeABI(joinSplitValidator.address);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     let firstNote = await ace.getNote(sender, inputNotes[0].noteHash);
        //     expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        //     let secondNote = await ace.getNote(sender, inputNotes[1].noteHash);
        //     expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);

        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[1].proofData);
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     firstNote = await ace.getNote(sender, inputNotes[0].noteHash);
        //     expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        //     secondNote = await ace.getNote(sender, inputNotes[0].noteHash);
        //     expect(secondNote.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        // });

        // it('should update a note registry by consuming input notes, with kPublic negative', async () => {
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData);
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[1].proofData);
        //     const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     expect(aceReceipt.status).to.equal(true);
        //     expect(regReceipt.status).to.equal(true);
        // });

        // it('should update a note registry by consuming input notes, with kPublic positive', async () => {
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[2].proofData);
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[3].proofData);
        //     const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender);

        //     expect(aceReceipt.status).to.equal(true);
        //     expect(regReceipt.status).to.equal(true);
        // });

        // it('should update a note registry with kPublic = 0', async () => {
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[4].proofData);
        //     let formattedProofOutput = `0x${proofOutputs[4].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[5].proofData);
        //     formattedProofOutput = `0x${proofOutputs[5].slice(0x40)}`;
        //     const { receipt: regReceipt } = await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     expect(aceReceipt.status).to.equal(true);
        //     expect(regReceipt.status).to.equal(true);
        // });
    });

    describe('Failure States', async () => {
        it('should fail to read a non-existent note', async () => {
            await truffleAssert.reverts(ace.getNote(accounts[1], inputNotes[0].noteHash), 'expected note to exist');
        });

        it('should fail to read a non-existent registry', async () => {
            await truffleAssert.reverts(ace.getRegistry(accounts[1]), 'expected registry to be created');
        });

        it('should fail to create a note registry if sender already owns one', async () => {
            await truffleAssert.reverts(
                ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert),
                'address already has a linked note registry',
            );
        });

        it('should fail to create a note registry if linked token address is 0x0', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                ace.createNoteRegistry(constants.addresses.ZERO_ADDRESS, scalingFactor, canAdjustSupply, canConvert, opts),
                'expected the linked token address to exist',
            );
        });

        it('should fail to public approve tokens if no registry exists for the given address', async () => {
            await truffleAssert.reverts(ace.publicApprove(accounts[1], proof.hash, publicValue), 'note registry does not exist');
        });

        it('should fail to update a note registry if no registry exists for the given address', async () => {
            const opts = { from: accounts[1] };
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender, opts),
                'note registry does not exist for the given address',
            );
        });

        it('should fail to update a note registry if proof output is malformed', async () => {
            const data = proof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender),
                'ACE has not validated a matching proof',
            );
        });

        it('should fail to update a note registry if proof is not valid', async () => {
            const data = proof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(BOGUS_PROOF, proof.eth.output, sender),
                'ACE has not validated a matching proof',
            );
        });

        it('should fail to update a note registry if proof sender is different', async () => {
            const data = proof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, accounts[1]),
                'ACE has not validated a matching proof',
            );
        });

        it('should fail to update a note registry is public value is non-zero and conversion is deactivated', async () => {
            const canConvertFlag = false;
            const opts = { from: accounts[1] };
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvertFlag, opts);
            const data = proof.encodeABI();
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender, opts),
                'asset cannot be converted into public tokens',
            );
        });

        it('should fail to update a note registry if public approval value is insufficient', async () => {
            const data = proof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, data);
            await ace.publicApprove(
                sender,
                proof.hash,
                5, // kPublic is -10
            );
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, sender),
                'public owner has not validated a transfer of tokens',
            );
        });

        it('should fail to update a note registry if the erc20 transferFrom fails', async () => {
            const opts = { from: accounts[1] };
            const erc20BrokenTransferFromTest = await ERC20BrokenTransferFromTest.new();
            await erc20BrokenTransferFromTest.mint(sender, scalingFactor.mul(tokensTransferred));
            await erc20BrokenTransferFromTest.approve(ace.address, scalingFactor.mul(tokensTransferred));
            await ace.createNoteRegistry(erc20BrokenTransferFromTest.address, scalingFactor, canAdjustSupply, canConvert, opts);

            await ace.publicApprove(accounts[1], proof.hash, 10);
            await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData, opts);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proof.eth.output, accounts[1], opts),
                'you shall not pass',
            );
        });

        // it('should fail to update a note registry if the erc20 transfer fails', async () => {
        //     const opts = { from: accounts[2] };
        //     const erc20BrokenTransferTest = await ERC20BrokenTransferTest.new();
        //     await erc20BrokenTransferTest.mint(sender, scalingFactor.mul(tokensTransferred));
        //     await erc20BrokenTransferTest.mint(accounts[2], scalingFactor.mul(tokensTransferred));
        //     await erc20BrokenTransferTest.approve(ace.address, scalingFactor.mul(tokensTransferred));
        //     await erc20BrokenTransferTest.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);

        //     await ace.createNoteRegistry(erc20BrokenTransferTest.address, scalingFactor, canAdjustSupply, canConvert, opts);
        //     await ace.publicApprove(accounts[2], proofHashes[2], 130, opts);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[2].proofData, opts);
        //     let formattedProofOutput = `0x${proofOutputs[2].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[2], opts);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[3].proofData, opts);
        //     formattedProofOutput = `0x${proofOutputs[3].slice(0x40)}`;
        //     await truffleAssert.reverts(
        //         ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[2], opts),
        //         'you shall not pass',
        //     );
        // });

        // it('should fail to update a note registry if input notes do not exist in the registry', async () => {
        //     await ace.publicApprove(sender, proofHashes[1], 10);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[1].proofData);
        //     const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
        //     await truffleAssert.reverts(
        //         ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender),
        //         'input note status is not UNSPENT',
        //     );
        // });

        // it('should fail to update a note registry if output notes already exist in the registry', async () => {
        //     await ace.publicApprove(sender, proofHashes[0], 10);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[0].proofData);
        //     let formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
        //     await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender);

        //     proofs[6] = proof.joinSplit.encodeJoinSplitTransaction({
        //         inputNotes: [],
        //         outputNotes: notes.slice(0, 2),
        //         senderAddress: sender,
        //         inputNoteOwners: [],
        //         publicOwner: sender,
        //         kPublic: -10,
        //         validatorAddress: aztecJoinSplit.address,
        //     });
        //     proofOutputs[6] = encoder.outputCoder.getProofOutput(proofs[6].expectedOutput, 0);
        //     proofHashes[6] = encoder.outputCoder.hashProofOutput(proofOutputs[6]);

        //     await ace.publicApprove(sender, proofHashes[6], 10);
        //     await ace.validateProof(JOIN_SPLIT_PROOF, sender, proofs[6].proofData);
        //     formattedProofOutput = `0x${proofOutputs[6].slice(0x40)}`;
        //     await truffleAssert.reverts(
        //         ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, sender),
        //         'output note exists',
        //     );
        // });
    });
});
