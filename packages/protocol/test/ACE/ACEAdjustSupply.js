/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { abiEncoder, note, proof } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { BURN_PROOF, JOIN_SPLIT_PROOF, MINT_PROOF, BILATERAL_SWAP_PROOF, DIVIDEND_PROOF } = devUtils.proofs;
const { constants } = devUtils;
const { outputCoder } = abiEncoder;

// ### Artifacts
const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');
const AdjustSupply = artifacts.require('./AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./AdjustSupplyInterface');
const Swap = artifacts.require('./Swap');
const SwapInterface = artifacts.require('./SwapInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;
Swap.abi = SwapInterface.abi;

contract('ACE Mint and Burn Functionality', (accounts) => {
    describe('Success States', () => {
        let ace;
        let aztecAdjustSupply;
        let aztecSwap;
        let aztecJoinSplit;
        let aztecDividend;
        let erc20;
        const kPublic = 50;
        const tokensTransferred = new BN(1000);
        let zeroNote;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();
            aztecSwap = await Swap.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            await ace.setProof(UTILITY_PROOF, aztecSwap.address);

            // Creating a fixed note
            zeroNote = await note.createZeroValueNote();

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });
            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });
        });

        it('should mint confidential assets', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const { receipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(receipt.status).to.equal(true);
        });

        it('should validate mint proof', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const { receipt: aceReceipt } = await ace.validateProof(MINT_PROOF, accounts[0], proofs[0].proofData);
            expect(aceReceipt.status).to.equal(true);
        });

        it('should validate burn proof', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            const { receipt: burnReceipt } = await ace.validateProof(BURN_PROOF, accounts[0], proofs[1].proofData);

            expect(mintReceipt.status).to.equal(true);
            expect(burnReceipt.status).to.equal(true);
        });

        it('should validate utility proof', async () => {
            // Using a Swap proof
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            proofs[0] = proof.swap.encodeSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
            });

            const { receipt: utilityReceipt } = await ace.validateProof(BILATERAL_SWAP_PROOF, accounts[0], proofs[0].proofData);

            expect(utilityReceipt.status).to.equal(true);
        });

        it('should mint and burn confidential assets', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            const { receipt } = await ace.burn(BURN_PROOF, proofs[1].proofData, accounts[0]);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('Failure States', () => {
        let ace;
        let zeroNote;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        let aztecSwap;
        let erc20;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();
            aztecSwap = await Swap.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            await ace.setProof(UTILITY_PROOF, aztecSwap.address);

            zeroNote = await note.createZeroValueNote();
        });

        it('should fail if minted balance is greater than linked token balance', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const kPublic = 50; // kPublic is one greater than linked token balance
            const tokensTransferred = new BN(49);
            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);
            const proofs = [];

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;
            // Mint 49
            await erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });
            // ZK mint 50
            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            // Validate proof to transfer 50
            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            // Fail when you try to enact the transfer of 50
            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]));
        });

        it('should fail if asset is not mintable', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);
            const proofs = [];

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = false;
            const canConvert = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            await truffleAssert.reverts(ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]), 'this asset is not mintable');
        });

        it('should fail when converting value and asset is NOT convertible', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const kPublic = 50; // kPublic is one greater than linked token balance
            const tokensTransferred = new BN(50);
            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);
            const proofs = [];

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = false;

            await erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]),
                'asset cannot be converted into public tokens',
            );
        });

        it('should fail if ACE has not been approved to extract tokens', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );
            const proofs = [];

            const kPublic = 50;
            const tokensTransferred = new BN(50);
            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred), { from: accounts[0], gas: 4700000 });

            // No approval

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]));
        });

        it('should not update the validatedProofs mapping if proof is not balanced', async () => {
            // MINT and BURN proofs are not in the category BALANCED. So will use a MINT proof to demonstrate this
            // failure case
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );
            const proofs = [];

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);

            const { receipt: aceReceipt } = await ace.validateProof(MINT_PROOF, accounts[0], proofs[0].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(
                ace.updateNoteRegistry(MINT_PROOF, formattedProofOutput, accounts[0]),
                'ACE has not validated a matching proof',
            );
        });

        it('should not update the validatedProofs mapping for mint proofs', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: aceReceipt } = await ace.validateProof(MINT_PROOF, accounts[0], proofs[0].proofData);
            await truffleAssert.reverts(
                ace.updateNoteRegistry(MINT_PROOF, proofs[0].proofData, accounts[0]),
                'ACE has not validated a matching proof',
            );

            expect(aceReceipt.status).to.equal(true);
        });

        it('should not update the validatedProofs mapping for burn proofs', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20];
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = zeroNote;

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            const { receipt: burnReceipt } = await ace.validateProof(BURN_PROOF, accounts[0], proofs[1].proofData);

            await truffleAssert.reverts(
                ace.updateNoteRegistry(BURN_PROOF, proofs[1].proofData, accounts[0]),
                'ACE has not validated a matching proof',
            );
            expect(mintReceipt.status).to.equal(true);
            expect(burnReceipt.status).to.equal(true);
        });

        it('should not update the validatedProofs mapping for utility proofs', async () => {
            // Using a Swap proof
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20];
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            proofs[0] = proof.swap.encodeSwapTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress: accounts[0],
            });

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            console.log('created the note registry');

            const { receipt: utilityReceipt } = await ace.validateProof(DIVIDEND_PROOF, accounts[0], dividendProof.proofData);
            console.log('validated the proof');
            await truffleAssert.reverts(
                ace.updateNoteRegistry(DIVIDEND_PROOF, dividendProof.proofData, accounts[0]),
                'ACE has not validated a matching proof',
            );

            expect(utilityReceipt.status).to.equal(true);
        });

        it('should fail if two note registries are linked to the same ERC20 token', async () => {
            const scalingFactor = new BN(10);
            const tokensTransferred = new BN(50);

            // User A creates a note registry linked to a particular ERC20 token, and
            // transfers 50 tokens to it

            const [ownerA, attacker] = accounts;
            const [recipient1, recipient2] = [...new Array(2)].map(() => secp256k1.generateAccount());

            erc20 = await ERC20Mintable.new();

            await erc20.mint(ownerA, scalingFactor.mul(tokensTransferred), { from: ownerA, gas: 4700000 });

            // Set the first note registry
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: ownerA,
                gas: 4700000,
            });

            await erc20.approve(
                ace.address, // address approving to spend
                scalingFactor.mul(tokensTransferred), // value to transfer
                { from: ownerA, gas: 4700000 },
            );

            const outputNotes = [await note.create(recipient1.publicKey, 50)];

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes,
                senderAddress: ownerA,
                inputNoteOwners: [],
                publicOwner: ownerA,
                kPublic: -50,
                validatorAddress: aztecJoinSplit.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            await ace.publicApprove(ownerA, depositProofHash, 50, { from: ownerA });

            await ace.validateProof(JOIN_SPLIT_PROOF, ownerA, depositProof.proofData, { from: ownerA });

            const formattedProofOutput = `0x${depositProofOutput.slice(0x40)}`;

            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, ownerA, { from: ownerA });

            // Attacker creates a note registry, linked to same public ERC20 contract
            const canAdjustSupplyAttacker = true;
            const canConvertAttacker = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupplyAttacker, canConvertAttacker, {
                from: attacker,
            });

            const newTotalMinted = await note.create(recipient2.publicKey, 1);
            const oldTotalMinted = await note.createZeroValueNote();
            const adjustedNotes = [await note.create(recipient2.publicKey, 1)];

            const mintProof = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: attacker,
            });

            await ace.mint(MINT_PROOF, mintProof.proofData, attacker, { from: attacker });

            // User B attempts to convert their minted note into tokens via updateNoteRegisty()
            const attackerJoinSplitProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: attacker,
                inputNoteOwners: [recipient2],
                publicOwner: attacker,
                kPublic: 1,
                validatorAddress: aztecJoinSplit.address,
            });

            await ace.validateProof(JOIN_SPLIT_PROOF, attacker, attackerJoinSplitProof.proofData, { from: attacker });

            const attackerJoinSplitProofOutput = outputCoder.getProofOutput(attackerJoinSplitProof.expectedOutput, 0);
            const attackerJoinSplitProofHash = outputCoder.hashProofOutput(attackerJoinSplitProofOutput);

            const formattedProofOutputAttacker = `0x${attackerJoinSplitProofOutput.slice(0x40)}`;

            await ace.publicApprove(attacker, attackerJoinSplitProofHash, 1, { from: attacker });

            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutputAttacker, attacker, { from: attacker }),
            );
        });
    });
});
