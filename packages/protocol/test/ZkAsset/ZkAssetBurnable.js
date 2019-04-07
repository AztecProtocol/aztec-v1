/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { BURN_PROOF, JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const AdjustSupply = artifacts.require('./contracts/ACE/validators/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/AdjustSupplyInterface');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplit');

const ZkAssetBurnable = artifacts.require('./contracts/ZkAsset/ZkAssetBurnable');


AdjustSupply.abi = AdjustSupplyInterface.abi;
JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAssetBurnable', (accounts) => {
    describe('success states', () => {
        let aztecAccounts = [];
        let notes = [];
        let ace;
        let erc20;
        let zkAssetBurnable;
        let scalingFactor;
        let aztecAdjustSupply;
        const proofs = [];
        let aztecJoinSplit;
        const kPublic = -50;

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
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            const newTotalBurned = notes[0];
            const oldTotalBurned = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);

            const canBurnAndBurn = true;
            const canConvert = true;

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);
            const tokensTransferred = new BN(50);

            zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canBurnAndBurn,
                canConvert,
                { from: accounts[0] }
            );

            erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred)
            );

            erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred)
            );

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: adjustedNotes,
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned, // 50
                oldTotalBurned, // 0
                adjustedNotes, // 30 + 20
                senderAddress: zkAssetBurnable.address,
            });

            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
            const proofHash = outputCoder.hashProofOutput(proofOutput);

            await ace.publicApprove(
                zkAssetBurnable.address,
                proofHash,
                50,
                { from: accounts[0] }
            );
        });

        it('transfer public value in, then burn it', async () => {
            const linkedTokenInitialBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            const aceInitialBalance = (await erc20.balanceOf(ace.address)).toNumber();

            expect(linkedTokenInitialBalance).to.equal(-kPublic);
            expect(aceInitialBalance).to.equal(0);

            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(proofs[0].proofData);
            expect(joinSplitReceipt.status).to.equal(true);

            const linkedTokenIntermediatateBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            expect(linkedTokenIntermediatateBalance).to.equal(0);
            const aceIntermediateBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(aceIntermediateBalance).to.equal(-kPublic);

            const { receipt: burnReceipt } = await zkAssetBurnable.confidentialBurn(BURN_PROOF, proofs[1].proofData);
            expect(burnReceipt.status).to.equal(true);

            const aceBalanceFinal = (await erc20.balanceOf(ace.address)).toNumber();
            const linkedTokenFinalBalance = (await erc20.balanceOf(accounts[0])).toNumber();

            expect(aceBalanceFinal).to.equal(-kPublic);
            expect(linkedTokenFinalBalance).to.equal(0);
        });
    });

    describe('failure states', () => {
        let ace;
        const proofs = [];
        let erc20;
        let zkAssetBurnable;
        let scalingFactor;
        let aztecAdjustSupply;
        let aztecJoinSplit;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAdjustSupply = await AdjustSupply.new();
            aztecJoinSplit = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(BURN_PROOF, aztecAdjustSupply.address);
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);
        });

        it('validates failure if burn attempted when flag set to false', async () => {
            const canAdjustSupply = false;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalBurned = notes[0];
            const oldTotalBurned = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);

            zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);
            const kPublic = -50;
            const tokensTransferred = new BN(1000);

            erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred)
            );

            erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred)
            );


            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: adjustedNotes,
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
            const proofHash = outputCoder.hashProofOutput(proofOutput);

            // Burning two AZTEC notes, worth 30 and 20
            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: zkAssetBurnable.address,
            });

            await ace.publicApprove(
                zkAssetBurnable.address,
                proofHash,
                50,
                { from: accounts[0] }
            );

            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(proofs[0].proofData);
            expect(joinSplitReceipt.status).to.equal(true);
            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, proofs[1].proofData),
                'this asset is not burnable');
        });

        it('validate failure if msg.sender is not owner', async () => {
            const canAdjustSupply = true;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [50, 0, 30, 20]; // note we do not use this third note, we create fixed one
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });


            zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const newTotalBurned = notes[0];
            const oldTotalBurned = note.createZeroValueNote();
            const adjustedNotes = notes.slice(2, 4);

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);
            const kPublic = -50;
            const tokensTransferred = new BN(1000);

            erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred)
            );

            erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred)
            );


            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: adjustedNotes,
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const senderAddress = proof.proofUtils.randomAddress();

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress,
            });


            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
            const proofHash = outputCoder.hashProofOutput(proofOutput);

            await ace.publicApprove(
                zkAssetBurnable.address,
                proofHash,
                50,
                { from: accounts[0] }
            );

            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(proofs[0].proofData);
            expect(joinSplitReceipt.status).to.equal(true);
            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, proofs[1].proofData, { from: accounts[1] }),
                'only the owner can call the confidentialBurn() method');
        });

        it('validate failure if ace.burn throws', async () => {
            const canAdjustSupply = true;
            const canConvert = true;

            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const joinSplitNoteValues = [50, 0, 30, 20];

            // total inputs != total outputs
            const burnNoteValues = [50, 0, 30, 21];

            const joinSplitNotes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, joinSplitNoteValues[i]);
            });

            const burnNotes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, burnNoteValues[i]);
            });


            zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                { from: accounts[0] }
            );

            const publicOwner = accounts[0];
            const inputNoteOwners = aztecAccounts.slice(2, 4);
            const kPublic = -50;
            const tokensTransferred = new BN(1000);

            erc20.mint(
                accounts[0],
                scalingFactor.mul(tokensTransferred)
            );

            erc20.approve(
                ace.address,
                scalingFactor.mul(tokensTransferred)
            );

            const outputNotes = joinSplitNotes.slice(2, 4);

            proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes,
                senderAddress: accounts[0],
                inputNoteOwners,
                publicOwner,
                kPublic,
                validatorAddress: aztecJoinSplit.address,
            });

            const senderAddress = proof.proofUtils.randomAddress();

            const newTotalBurned = burnNotes[0];
            const oldTotalBurned = note.createZeroValueNote();
            const adjustedNotes = burnNotes.slice(2, 4);

            proofs[1] = proof.burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress,
            });


            const proofOutput = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
            const proofHash = outputCoder.hashProofOutput(proofOutput);

            await ace.publicApprove(
                zkAssetBurnable.address,
                proofHash,
                50,
                { from: accounts[0] }
            );

            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(proofs[0].proofData);
            expect(joinSplitReceipt.status).to.equal(true);
            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, proofs[1].proofData));
        });
    });
});
