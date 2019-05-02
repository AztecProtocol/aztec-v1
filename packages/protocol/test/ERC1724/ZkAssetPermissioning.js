/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof } = require('aztec.js');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const truffleAssert = require('truffle-assertions');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');
const ZkAsset = artifacts.require('./ZkAsset');

JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAsset signature validation tests', (accounts) => {
    let ace;
    let aztecJoinSplit;
    const canAdjustSupply = false;
    const canConvert = true;
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);
    let erc20;

    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        await ace.setCommonReferenceString(constants.CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);
        erc20 = await ERC20Mintable.new();

        await Promise.all(
            accounts.map((account) => {
                const opts = { from: accounts[0], gas: 4700000 };
                return erc20.mint(account, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
        await Promise.all(
            accounts.map((account) => {
                const opts = { from: account, gas: 4700000 };
                return erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
    });

    describe('Success States', async () => {
        it('should successfully transfer notes using confidentialTransfer()', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;
            const firstTransferAmountBN = new BN(firstTransferAmount);
            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const expectedBalancePostTransfer = balancePreTransfer.sub(firstTransferAmountBN.mul(scalingFactor));

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: zkAsset.address,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            const { receipt: depositReceipt } = await zkAsset.confidentialTransfer(
                depositProof.proofData,
                depositProof.signatures,
            );
            expect(depositReceipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            const { receipt: transferReceipt } = await zkAsset.confidentialTransfer(
                noteTransfer.proofData,
                noteTransfer.signatures,
                { from: accounts[0] },
            );

            expect(transferReceipt.status).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('validate failure if signatures are zero', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: zkAsset.address,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const length = 64;
            const zeroSignature = new Array(length).fill(0).join('');
            const zeroSignatures = `0x${zeroSignature + zeroSignature + zeroSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(noteTransfer.proofData, zeroSignatures));
        });

        it('validate failure if fake signatures are provided', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: zkAsset.address,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const fakeSignature = padLeft(crypto.randomBytes(32).toString('hex'));
            const fakeSignatures = `0x${fakeSignature + fakeSignature + fakeSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(noteTransfer.proofData, fakeSignatures));
        });

        it('validate failure if different note owner signs the transaction', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const fakeInputNoteOwners = aztecAccounts.slice(2, 4);

            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: fakeInputNoteOwners,
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: zkAsset.address,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(noteTransfer.proofData, noteTransfer.signatures));
        });

        it('validate failure if validator address is fake', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const fakeInputNoteOwners = aztecAccounts.slice(2, 4);

            const randomAddress = proof.proofUtils.randomAddress();
            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: fakeInputNoteOwners,
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: randomAddress,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(noteTransfer.proofData, noteTransfer.signatures));
        });

        it('validate failure if validator address is the joinSplit address', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [10, 20, 5, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const firstTransferAmount = 30;
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: firstTransferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const fakeInputNoteOwners = aztecAccounts.slice(2, 4);

            const secondTransferAmount = 0;
            const noteTransfer = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: fakeInputNoteOwners,
                publicOwner: accounts[1],
                kPublic: secondTransferAmount,
                validatorAddress: aztecJoinSplit.address,
            });

            const noteTransferProofOutput = outputCoder.getProofOutput(noteTransfer.expectedOutput, 0);
            const noteTransferProofHash = outputCoder.hashProofOutput(noteTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, firstTransferAmount, { from: accounts[0] });
            await ace.publicApprove(zkAsset.address, noteTransferProofHash, secondTransferAmount, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(noteTransfer.proofData, noteTransfer.signatures));
        });
    });
});
