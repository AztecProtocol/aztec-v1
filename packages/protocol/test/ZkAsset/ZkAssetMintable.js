/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { MINT_PROOF, JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/AdjustSupplyInterface');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplit');

const ZkAssetMintable = artifacts.require('./contracts/ZkAsset/ZkAssetMintable');


AdjustSupply.abi = AdjustSupplyInterface.abi;
JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAssetMintable', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let zkAssetMintable;
        let scalingFactor;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        const proofs = [];
        const kPublic = 50;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            const zeroNote = note.fromViewKey(viewingKey);

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            const canAdjustSupply = true;
            const canConvert = true;

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            // Minting two AZTEC notes, worth 30 and 20
            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted, // 50
                oldTotalMinted, // 0
                adjustedNotes, // 30 + 20
                senderAddress: zkAssetMintable.address,
            });

            // Create the proof that will transfer minted notes out
            // of the note registry into public form
            const publicOwner = accounts[1];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes, // 20 + 30
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners, // need the owners of the adjustedNotes
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });
        });

        it('should complete a mint operation', async () => {
            const { receipt } = await zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData);
            expect(receipt.status).to.equal(true);
        });

        it('should transfer minted value out of the note registry', async () => {
            const initialBalance = (await erc20.balanceOf(accounts[1])).toNumber();
            const { receipt: mintReceipt } = await zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData);
            expect(mintReceipt.status).to.equal(true);

            const { receipt: transferReceipt } = await zkAssetMintable.confidentialTransfer(proofs[1].proofData);
            const finalBalance = (await erc20.balanceOf(accounts[1])).toNumber();
            expect(transferReceipt.status).to.equal(true);
            expect(initialBalance).to.equal(0);
            expect(finalBalance).to.equal(kPublic);
        });
    });

    describe('failure states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        const proofs = [];
        let erc20;
        let zkAssetMintable;
        let scalingFactor;
        let aztecAdjustSupply;
        let aztecJoinSplit;
        let zeroNote;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            // Creating a fixed note
            const a = padLeft('1', 64);
            const k = padLeft('0', 8);
            const ephemeral = secp256k1.ec.keyFromPrivate(crypto.randomBytes(32));
            const viewingKey = `0x${a}${k}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
            zeroNote = note.fromViewKey(viewingKey);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);
        });

        it('validates failure if mint attempted when flag set to false', async () => {
            const canAdjustSupply = false;
            const canConvert = true;

            zkAssetMintable = await ZkAssetMintable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const newTotalMinted = notes[0];
            const oldTotalMinted = zeroNote;
            const adjustedNotes = notes.slice(2, 4);

            // Minting two AZTEC notes, worth 30 and 20
            proofs[0] = proof.mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: zkAssetMintable.address,
            });

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: adjustedNotes,
                outputNotes: [],
                senderAddress: accounts[0],
                inputNoteOwners, // need the owners of the adjustedNotes
                publicOwner,
                kPublic: 50,
                validatorAddress: aztecJoinSplit.address,
            });

            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, proofs[0].proofData));
        });
    });
});
