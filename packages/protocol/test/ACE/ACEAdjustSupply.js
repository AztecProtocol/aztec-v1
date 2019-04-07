/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, keccak256 } = require('web3-utils');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const {
    constants,
    proofs: {
        JOIN_SPLIT_PROOF, MINT_PROOF, BURN_PROOF, UTILITY_PROOF,
    },
} = require('@aztec/dev-utils');
const crypto = require('crypto');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/interfaces/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/interfaces/AdjustSupplyInterface');
const BilateralSwap = artifacts.require('./contracts/ACE/validators/adjustSupply/BilateralSwap');
const BilateralSwapInterface = artifacts.require('./contracts/interfaces/BilateralSwapInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;
BilateralSwap.abi = BilateralSwapInterface.abi;

contract('ACE mint and burn functionality', (accounts) => {
    describe('success states', () => {
        let ace;
        let zeroNote;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        let aztecBilateralSwap;
        const tokensTransferred = new BN(1000);
        const kPublic = 50;
        let erc20;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();
            aztecBilateralSwap = await BilateralSwap.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            await ace.setProof(UTILITY_PROOF, aztecBilateralSwap.address);

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            zeroNote = note.fromViewKey(viewingKey);

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );
        });

        it('successful call to the mint function', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

        it('confirm validateProof() succeeds for valid MINT category proof', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

        it('confirm validateProof() succeeds for valid BURN category proof', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

        it('confirm validateProof() succeeds for valid UTILITY category proof', async () => {
            // Using a bilateral swap proof
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            proofs[0] = proof.bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
            });

            const { receipt: utilityReceipt } = await ace.validateProof(UTILITY_PROOF, accounts[0], proofs[0].proofData);

            expect(utilityReceipt.status).to.equal(true);
        });

        it('successful mint and burn operation', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

    describe('failure states', () => {
        let ace;
        let zeroNote;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        let aztecBilateralSwap;
        let erc20;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();
            aztecBilateralSwap = await BilateralSwap.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
            await ace.setProof(UTILITY_PROOF, aztecBilateralSwap.address);


            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            zeroNote = note.fromViewKey(viewingKey);
        });

        it('should validate failure when attempting to transfer greater minted balance than linked token balance', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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
            await erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );
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

        it('should validate failure when attempting to mint on an asset that is not mintable', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            await truffleAssert.reverts(ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]),
                'this asset is not mintable');
        });

        it('should validate failure if trying to convert value when the asset is NOT convertible', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

            await erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]),
                'asset cannot be converted into public tokens');
        });

        it('should validate failure if user has not approved ACE to extract tokens', async () => {
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });
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

            await erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            // No approval

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0]));
        });

        it('confirm that validateProof does NOT update validatedProofs for a proof that is not BALANCED', async () => {
            // MINT and BURN proofs are not in the category BALANCED. So will use a MINT proof to demonstrate this
            // failure case
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });
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

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);

            const { receipt: aceReceipt } = await ace.validateProof(MINT_PROOF, accounts[0], proofs[0].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(MINT_PROOF, formattedProofOutput, accounts[0]),
                'ACE has not validated a matching proof');
        });

        it('confirm validateProof() does not store proofHash in validatedProofs for MINT_PROOF', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const { receipt: aceReceipt } = await ace.validateProof(MINT_PROOF, accounts[0], proofs[0].proofData);
            await truffleAssert.reverts(ace.updateNoteRegistry(MINT_PROOF, proofs[0].proofData, accounts[0]),
                'ACE has not validated a matching proof');

            expect(aceReceipt.status).to.equal(true);
        });

        it('confirm validateProof() does not store proofHash in validatedProofs for BURN_PROOF', async () => {
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

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

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            const { receipt: burnReceipt } = await ace.validateProof(BURN_PROOF, accounts[0], proofs[1].proofData);

            await truffleAssert.reverts(ace.updateNoteRegistry(BURN_PROOF, proofs[1].proofData, accounts[0]),
                'ACE has not validated a matching proof');
            expect(mintReceipt.status).to.equal(true);
            expect(burnReceipt.status).to.equal(true);
        });

        it('confirm validateProof() does not store proofHash in validatedProofs for UTILITY_PROOF', async () => {
            // Using a bilateral swap proof
            const proofs = [];
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 10, 20];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];

            proofs[0] = proof.bilateralSwap.encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress,
            });

            erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const { receipt: utilityReceipt } = await ace.validateProof(UTILITY_PROOF, accounts[0], proofs[0].proofData);
            await truffleAssert.reverts(ace.updateNoteRegistry(UTILITY_PROOF, proofs[0].proofData, accounts[0]),
                'ACE has not validated a matching proof');

            expect(utilityReceipt.status).to.equal(true);
        });

        it('confirm updateNoteRegistry() fails when two note registries are linked to the same ERC20 token', async () => {
            const proofs = [];
            const proofHashes = [];
            // User A creates a non-mintable note registry (X) linked to an ERC20 

            // // User B then creates a mintable note registry (Y) linked to the same ERC20
            // const userAddressB = accounts[1];
            // erc20 = await ERC20Mintable.new();
            // const canAdjustSupplyB = true;
            // const canConvertB = true;

            // await ace.createNoteRegistry(
            //     erc20.address,
            //     scalingFactor,
            //     canAdjustSupplyB,
            //     canConvertB,
            //     { from: userAddressB }
            // );

            // User A converts tokens Q (50) into an AZTEC note in note registry X
            // await erc20.mint(
            //     userAddressA,
            //     scalingFactor.mul(tokensTransferred)
            // );

            // const balance = await erc20.balanceOf(userAddressA);
            // console.log('balance: ', balance);

            // await erc20.approve(
            //     ace.address,
            //     scalingFactor.mul(tokensTransferred),
            //     { from: accounts[0], gas: 4700000 }
            // );

            // User A creates a note registry linked to an ERC20 token and converts tokens into it

            const aztecAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 1, 1];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 1),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -50,
                validatorAddress: aztecJoinSplit.address,
            });

            const canAdjustSupply = true;
            const canConvert = true;
            const scalingFactor = new BN(10);
            const tokensTransferred = new BN(100000);

            erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
            proofHashes[0] = outputCoder.hashProofOutput(proofOutput);
            const hex = parseInt(JOIN_SPLIT_PROOF, 10).toString(16);
            const hashData = [
                padLeft(proofHashes[0].slice(2), 64),
                padLeft(hex, 64),
                padLeft(accounts[0].slice(2), 64),
            ].join('');
            const validatedProofHash = keccak256(`0x${hashData}`);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;

            await erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred),
                { from: accounts[0], gas: 4700000 }
            );

            await erc20.approve(
                ace.address, // address approving to spend
                scalingFactor.mul(tokensTransferred), // value to transfer
                { from: accounts[0], gas: 4700000 }
            );

            await ace.publicApprove(
                accounts[0],
                proofHashes[0],
                100,
                { from: accounts[0] }
            );
            console.log('created first join split');

            const { receipt: joinSplitReceipt } = await ace.validateProof(
                JOIN_SPLIT_PROOF,
                accounts[0],
                proofs[0].proofData,
                { from: accounts[0] }
            );
            console.log('validated first join split');

            const result = await ace.validatedProofs(validatedProofHash);
            expect(result).to.equal(true);
            expect(joinSplitReceipt.status).to.equal(true);


            const { receipt: updateRegistryReceipt } = await ace.updateNoteRegistry(
                JOIN_SPLIT_PROOF, formattedProofOutput, accounts[0], { from: accounts[0] }
            );
            console.log('updated the first note registry');

            expect(updateRegistryReceipt.status).to.equal(true);

            // User B creates another note registry, linked to the same token
            // and mints into it
            const newTotalMinted = notes.slice(1, 2);
            const oldTotalMinted = [zeroNote];
            const adjustedNotes = notes.slice(2, 3);

            console.log('new totla minted length', newTotalMinted.length);
            console.log('old total minted length', oldTotalMinted.length);
            console.log('adjusted notes', adjustedNotes.length);

            proofs[1] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[1],
            });
            console.log('created mint proof data');

            // acounts[1] = user B
            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[1] }
            );
            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[1].proofData, accounts[1]);
            console.log('performed the first mint');
            expect(mintReceipt.status).to.equal(true);
            process.exit(1);

            // User B attempts to convert their minted note into tokens via updateNoteRegisty()
            proofs[2] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: userAddressB,
                inputNoteOwners: adjustedNotes.owner,
                publicOwner: userAddressB,
                kPublic: 1,
            });

            console.log('created final set of proof data');


            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, proofs[2].proofData, userAddressB));
        });
    });
});
