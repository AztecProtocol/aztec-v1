/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const crypto = require('crypto');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { encoder, note, proof, signer } = require('aztec.js');
const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft } = require('web3-utils');

const { JOIN_SPLIT_PROOF } = proofs;

// ### Artifacts
const ACE = artifacts.require('./ACE');
const JoinSplit = artifacts.require('./JoinSplit');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');
const ZkAsset = artifacts.require('./ZkAsset');

JoinSplit.abi = JoinSplitInterface.abi;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = signer.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${typedData.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

contract('ZkAsset', (accounts) => {
    let ace;
    let aztecJoinSplit;
    const canAdjustSupply = false;
    const canConvert = true;
    let erc20;
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);

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
        it('should compute the correct domain hash', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const domainHash = computeDomainHash(zkAsset.address);
            const result = await zkAsset.EIP712_DOMAIN_HASH();
            expect(result).to.equal(domainHash);
        });

        it('should set the flags', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const result = await zkAsset.flags();
            expect(result.active).to.equal(true);
            expect(result.canAdjustSupply).to.equal(false);
            expect(result.canConvert).to.equal(true);
        });

        it('should set the linked token', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const result = await zkAsset.linkedToken();
            expect(result).to.equal(erc20.address);
        });

        it('should set the scaling factor', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const result = await zkAsset.scalingFactor();
            expect(result.toNumber()).to.equal(scalingFactor.toNumber());
        });

        it('should update a note registry with output notes', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const noteValues = [0, 10];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const transferAmount = 10;
            const transferAmountBN = new BN(transferAmount);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: transferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = encoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = encoder.outputCoder.hashProofOutput(depositProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, transferAmount, { from: accounts[0] });

            const { receipt } = await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [0, 10, 20, 30];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = encoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = encoder.outputCoder.hashProofOutput(depositProofOutput);

            const tokenWithdrawalProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAsset.address,
            });

            const tokenWithdrawalProofOutput = encoder.outputCoder.getProofOutput(tokenWithdrawalProof.expectedOutput, 0);
            const tokenWithdrawalProofHash = encoder.outputCoder.hashProofOutput(tokenWithdrawalProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, 10, { from: accounts[0] });

            await ace.publicApprove(zkAsset.address, tokenWithdrawalProofHash, 40, { from: accounts[1] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const { receipt } = await zkAsset.confidentialTransfer(
                tokenWithdrawalProof.proofData,
                tokenWithdrawalProof.signatures,
            );
            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic positive', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [70, 60, 50, 40];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = encoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = encoder.outputCoder.hashProofOutput(depositProofOutput);

            const withdrawalAmount = 40;
            const withdrawalAmountBN = new BN(withdrawalAmount);

            const withdrawalAndTransferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[2],
                kPublic: withdrawalAmount,
                validatorAddress: zkAsset.address,
            });

            const withdrawalAndTransferProofOutput = encoder.outputCoder.getProofOutput(
                withdrawalAndTransferProof.expectedOutput,
                0,
            );
            const withdrawalAndTransferProofHash = encoder.outputCoder.hashProofOutput(withdrawalAndTransferProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, 130, { from: accounts[2] });

            await ace.publicApprove(zkAsset.address, withdrawalAndTransferProofHash, 40, { from: accounts[2] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const balancePreWithdrawal = await erc20.balanceOf(accounts[2]);
            const expectedBalancePostWithdrawal = balancePreWithdrawal.add(withdrawalAmountBN.mul(scalingFactor));
            const { receipt } = await zkAsset.confidentialTransfer(
                withdrawalAndTransferProof.proofData,
                withdrawalAndTransferProof.signatures,
            );
            const balancePostWithdrawal = await erc20.balanceOf(accounts[2]);
            expect(balancePostWithdrawal.toString()).to.equal(expectedBalancePostWithdrawal.toString());

            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            const noteValues = [5, 17, 13, 25];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = encoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = encoder.outputCoder.hashProofOutput(depositProofOutput);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                validatorAddress: zkAsset.address,
            });

            await ace.publicApprove(zkAsset.address, depositProofHash, 30, { from: accounts[3] });

            await zkAsset.confidentialTransfer(depositProof.proofData, depositProof.signatures);
            const { receipt } = await zkAsset.confidentialTransfer(transferProof.proofData, transferProof.signatures);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('should fail if the ace fails to validate the proof', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const aztecAccounts = [...new Array(2)].map(() => secp256k1.generateAccount());
            const noteValues = [0, 10];
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const transferAmount = 10;

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: transferAmount * -1,
                validatorAddress: zkAsset.address,
            });

            const depositProofOutput = encoder.outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = encoder.outputCoder.hashProofOutput(depositProofOutput);

            await ace.publicApprove(zkAsset.address, depositProofHash, transferAmount, { from: accounts[0] });
            const malformedProofData = `0x0123${depositProof.proofData.slice(6)}`;
            // no error message because it throws in assembly
            await truffleAssert.reverts(zkAsset.confidentialTransfer(malformedProofData, depositProof.signatures));
        });

        it('should fail if signatures are zero', async () => {
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

        it('should fail if fake signatures are provided', async () => {
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

        it('should fail if different note owner signs the transaction', async () => {
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

        it('should fail if validator address is fake', async () => {
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

        it('should fail if validator address is the joinSplit address', async () => {
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
