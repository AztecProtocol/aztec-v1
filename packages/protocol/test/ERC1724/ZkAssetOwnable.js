/* global artifacts, beforeEach, contract, expect,it */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { encoder, note, proof, signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { constants } = devUtils;
const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const { outputCoder } = encoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ACE = artifacts.require('./ACE');
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');
const ZkAssetOwnable = artifacts.require('./ZkAssetOwnable');
const ZkAssetOwnableTest = artifacts.require('./ZkAssetOwnableTest');

JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAssetOwnable', (accounts) => {
    let ace;
    let aztecJoinSplit;
    let erc20;
    let zkAssetOwnable;
    let zkAssetOwnableTest;

    const epoch = 1;
    const filter = 17; // 16 + 1, recall that 1 is the join-split validator because of 1 * 256**(0)
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);

    const confidentialApprove = async (indexes, notes, aztecAccounts) => {
        await Promise.all(
            indexes.map((i) => {
                const signature = signer.signNote(
                    zkAssetOwnable.address,
                    notes[i].noteHash,
                    zkAssetOwnableTest.address,
                    aztecAccounts[i].privateKey,
                );
                // eslint-disable-next-line no-await-in-loop
                return zkAssetOwnable.confidentialApprove(notes[i].noteHash, zkAssetOwnableTest.address, true, signature);
            }),
        );
    };

    beforeEach(async () => {
        ace = await ACE.new({
            from: accounts[0],
        });

        await ace.setCommonReferenceString(constants.CRS);
        aztecJoinSplit = await JoinSplit.new();
        await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

        erc20 = await ERC20Mintable.new();
        const canAdjustSupply = false;
        const canConvert = true;
        zkAssetOwnable = await ZkAssetOwnable.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await zkAssetOwnable.setProofs(epoch, filter);
        zkAssetOwnableTest = await ZkAssetOwnableTest.new();
        await zkAssetOwnableTest.setZkAssetOwnableAddress(zkAssetOwnable.address);

        await Promise.all(
            accounts.map((account) => {
                const opts = {
                    from: accounts[0],
                    gas: 4700000,
                };
                return erc20.mint(account, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
        await Promise.all(
            accounts.map((account) => {
                const opts = {
                    from: account,
                    gas: 4700000,
                };
                return erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), opts);
            }),
        );
    });

    describe('Success States', () => {
        it('should set a new proof bit filter', async () => {
            const { receipt } = await zkAssetOwnable.setProofs(epoch, filter);
            expect(receipt.status).to.equal(true);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic negative', async () => {
            const noteValues = [0, 10, 30, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            const transferProofHash = outputCoder.hashProofOutput(transferProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 40, {
                from: accounts[1],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);
            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);

            expect(receipt.status).to.equal(true);
        });

        it('should delegate a contract to update a note registry by consuming input notes, with kPublic positive', async () => {
            const noteValues = [60, 70, 50, 40];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -130,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 130, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: 40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);

            await confidentialApprove([0, 1], notes, aztecAccounts);

            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);
            expect(receipt.status).to.equal(true);

            const spentNoteHash = notes[0].noteHash;
            const result = await ace.getNote(zkAssetOwnable.address, spentNoteHash);
            expect(result.status.toNumber()).to.equal(constants.statuses.NOTE_SPENT);
        });

        it('should delegate a contract to update a note registry with kPublic = 0', async () => {
            const noteValues = [10, 20, 15, 15];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[1]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -30,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 30, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[1]],
                outputNotes: [notes[2], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: 0, // perfectly balanced...
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            await confidentialApprove([0, 1], notes, aztecAccounts);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);

            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            const { receipt } = await zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('should fail to set a new proof bit filter if not owner', async () => {
            const opts = {
                from: accounts[1],
            };
            await truffleAssert.reverts(zkAssetOwnable.setProofs(epoch, filter, opts), 'only the owner can set the epoch proofs');
        });

        it("should fail to approve a contract to update a note registry if note doesn't exist", async () => {
            const noteValues = [0, 10, 30];
            const numNotes = 3;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 30, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const signature = signer.signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[0].privateKey,
            );
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(
                    notes[2].noteHash, // wrong note hash
                    zkAssetOwnableTest.address,
                    true,
                    signature,
                ),
                'expected note to exist',
            );
        });

        it('should fail to approve a contract to update a note registry if note had already been spent', async () => {
            const noteValues = [0, 10, 30, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            const transferProofHash = outputCoder.hashProofOutput(transferProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 40, {
                from: accounts[1],
            });

            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);
            await zkAssetOwnable.confidentialTransfer(transferProof.proofData, transferProof.signatures);

            const signature = signer.signNote(
                zkAssetOwnable.address,
                notes[0].noteHash,
                zkAssetOwnableTest.address,
                aztecAccounts[0].privateKey,
            );
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(notes[0].noteHash, zkAssetOwnableTest.address, true, signature),
                'only unspent notes can be approved',
            );
        });

        // eslint-disable-next-line max-len
        it('should fail to approve a contract to update a note registry if no ECDSA signature is provided and the sender is not the note owner', async () => {
            const noteValues = [0, 10];
            const numNotes = 2;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });

            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const emptySignature = '0x';
            await truffleAssert.reverts(
                zkAssetOwnable.confidentialApprove(notes[0].noteHash, zkAssetOwnableTest.address, true, emptySignature),
                'the note owner did not sign this message',
            );
        });

        it('should fail to delegate a contract to update a note registry is proof is not supported', async () => {
            const noteValues = [0, 10, 30, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });

            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            const transferProofHash = outputCoder.hashProofOutput(transferProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 40, {
                from: accounts[1],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);
            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);

            const bogusProof = `${parseInt(JOIN_SPLIT_PROOF, 10) + 1}`; // adding 1 changes the proof id from the proof object
            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(bogusProof, formattedProofOutput),
                'expected proof to be supported',
            );
        });

        it('should fail to delegate a contract to update a note registry if publicApprove has not been called', async () => {
            const noteValues = [0, 10, 30, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            const transferProofHash = outputCoder.hashProofOutput(transferProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 40, {
                from: accounts[1],
            });

            await confidentialApprove([0, 1], notes, aztecAccounts);

            const opts = {
                from: accounts[1],
            };
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 0, opts);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);

            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput),
                'public owner has not validated a transfer of tokens',
            );
        });

        it('should fail to confidentialTransferFrom() if confidentialApprove() has not been called', async () => {
            const noteValues = [0, 10, 30, 20];
            const numNotes = 4;
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: zkAssetOwnable.address,
            });
            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, depositProofHash, 10, {
                from: accounts[0],
            });
            await zkAssetOwnable.confidentialTransfer(depositProof.proofData, depositProof.signatures);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: zkAssetOwnable.address,
            });
            const transferProofOutput = outputCoder.getProofOutput(transferProof.expectedOutput, 0);
            const transferProofHash = outputCoder.hashProofOutput(transferProofOutput);
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 40, {
                from: accounts[1],
            });

            // No confidentialApprove() call

            const opts = {
                from: accounts[1],
            };
            await ace.publicApprove(zkAssetOwnable.address, transferProofHash, 0, opts);

            await zkAssetOwnableTest.callValidateProof(JOIN_SPLIT_PROOF, transferProof.proofData);

            const formattedProofOutput = `0x${transferProofOutput.slice(0x40)}`;
            await truffleAssert.reverts(
                zkAssetOwnableTest.callConfidentialTransferFrom(JOIN_SPLIT_PROOF, formattedProofOutput),
                'sender does not have approval to spend input note',
            );
        });
    });
});
