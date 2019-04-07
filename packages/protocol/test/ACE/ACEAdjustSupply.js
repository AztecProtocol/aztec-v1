/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
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
            zeroNote = note.createZeroValueNote();

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

            zeroNote = note.createZeroValueNote();
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
            const scalingFactor = new BN(10);
            const tokensTransferred = new BN(50);

            // User A creates a note registry linked to a particular ERC20 token, and 
            // transfers 50 tokens to it

            const [ownerA, attacker] = accounts;
            const [recipient1, recipient2] = [...new Array(2)].map(() => secp256k1.generateAccount());

            erc20 = await ERC20Mintable.new();

            await erc20.mint(
                ownerA,
                scalingFactor.mul(tokensTransferred),
                { from: ownerA, gas: 4700000 }
            );

            // Set the first note registry
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: ownerA, gas: 4700000 }
            );

            await erc20.approve(
                ace.address, // address approving to spend
                scalingFactor.mul(tokensTransferred), // value to transfer
                { from: ownerA, gas: 4700000 }
            );

            const outputNotes = [note.create(recipient1.publicKey, 50)];

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

            await ace.publicApprove(
                ownerA,
                depositProofHash,
                50,
                { from: ownerA }
            );

            await ace.validateProof(
                JOIN_SPLIT_PROOF,
                ownerA,
                depositProof.proofData,
                { from: ownerA }
            );

            const formattedProofOutput = `0x${depositProofOutput.slice(0x40)}`;

            await ace.updateNoteRegistry(
                JOIN_SPLIT_PROOF, formattedProofOutput, ownerA, { from: ownerA }
            );

            // Attacker creates a note registry, linked to same public ERC20 contract 
            const canAdjustSupplyAttacker = true;
            const canConvertAttacker = true;

            await ace.createNoteRegistry(
                erc20.address,
                scalingFactor,
                canAdjustSupplyAttacker,
                canConvertAttacker,
                { from: attacker }
            );

            const newTotalMinted = note.create(recipient2.publicKey, 1);
            const oldTotalMinted = note.createZeroValueNote();
            const adjustedNotes = [note.create(recipient2.publicKey, 1)];

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

            await ace.validateProof(
                JOIN_SPLIT_PROOF,
                attacker,
                attackerJoinSplitProof.proofData,
                { from: attacker }
            );

            const attackerJoinSplitProofOutput = outputCoder.getProofOutput(attackerJoinSplitProof.expectedOutput, 0);
            const attackerJoinSplitProofHash = outputCoder.hashProofOutput(attackerJoinSplitProofOutput);

            const formattedProofOutputAttacker = `0x${attackerJoinSplitProofOutput.slice(0x40)}`;

            await ace.publicApprove(
                attacker,
                attackerJoinSplitProofHash,
                1,
                { from: attacker }
            );

            await truffleAssert.reverts(ace.updateNoteRegistry(
                JOIN_SPLIT_PROOF,
                formattedProofOutputAttacker,
                attacker,
                { from: attacker }
            ));
        });
    });
});
