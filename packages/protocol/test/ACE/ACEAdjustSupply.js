/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF, MINT_PROOF, BURN_PROOF } } = require('@aztec/dev-utils');
const crypto = require('crypto');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ACE = artifacts.require('./contracts/ACE/ACE');
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const JoinSplit = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/joinSplit/JoinSplitInterface');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyInterface');

JoinSplit.abi = JoinSplitInterface.abi;
AdjustSupply.abi = AdjustSupplyInterface.abi;

contract('ACE mint and burn functionality', (accounts) => {
    describe('success states', () => {
        let ace;
        let zeroNote;
        let aztecAccounts;
        let notes;
        const proofs = [];
        let aztecAdjustSupply;
        let aztecJoinSplit;
        const tokensTransferred = new BN(1000);
        const kPublic = 50;
        let erc20;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);


            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            zeroNote = note.fromViewKey(viewingKey);

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
            const { receipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(receipt.status).to.equal(true);
        });

        it('successful burning of the minting notes', async () => {
            await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            const { receipt } = await ace.burn(BURN_PROOF, proofs[1].proofData, accounts[0]);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('failure states', () => {
        let ace;
        let zeroNote;
        let aztecAccounts;
        let notes;
        const proofs = [];
        let aztecAdjustSupply;
        let proofOutput;
        let aztecJoinSplit;
        let erc20;
        let adjustedNotes;

        beforeEach(async () => {
            ace = await ACE.new({
                from: accounts[0],
            });

            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);


            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create a fixed one
            notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            zeroNote = note.fromViewKey(viewingKey);

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            adjustedNotes = notes.slice(2, 4);

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
        });

        it('validate failure when attempting to transfer greater minted balance than linked token balance', async () => {
            const kPublic = 50; // kPublic is one greater than linked token balance
            const tokensTransferred = new BN(49);
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

            proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

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

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, proofs[0].proofData, accounts[0]);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: aceReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, accounts[0], proofs[2].proofData);
            expect(aceReceipt.status).to.equal(true);

            const formattedProofOutput = `0x${proofOutput.slice(0x40)}`;
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput));
        });

        it('validate failure if trying to convert value when the asset is NOT convertible', async () => {
            const kPublic = 50; // kPublic is one greater than linked token balance
            const tokensTransferred = new BN(50);
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

            proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

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
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput));
        });

        it('validate failure if user has not approved ACE to extract tokens', async () => {
            const kPublic = 50;
            const tokensTransferred = new BN(50);
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

            proofOutput = outputCoder.getProofOutput(proofs[2].expectedOutput, 0);

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
            await truffleAssert.reverts(ace.updateNoteRegistry(JOIN_SPLIT_PROOF, accounts[0], formattedProofOutput));
        });
    });
});
