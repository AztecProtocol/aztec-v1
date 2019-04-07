/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAsset = artifacts.require('./contracts/ZkAsset/ZkAsset');


JoinSplit.abi = JoinSplitInterface.abi;

contract('ZkAsset', (accounts) => {
    describe('success states', () => {
        let ace;
        let aztecAccounts = [];
        let aztecJoinSplit;
        const canAdjustSupply = false;
        const canConvert = true;
        let erc20;
        let notes = [];
        let scalingFactor;
        const tokensTransferred = new BN(100000);
        let zkAsset;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            aztecAccounts = [...new Array(10)].map(() => secp256k1.generateAccount());
            notes = [
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
                ...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
            ];
            await ace.setCommonReferenceString(constants.CRS);
            aztecJoinSplit = await JoinSplit.new();
            await ace.setProof(JOIN_SPLIT_PROOF, aztecJoinSplit.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
            zkAsset = await ZkAsset.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert
            );

            await Promise.all(accounts.map((account) => {
                const opts = { from: accounts[0], gas: 4700000 };
                return erc20.mint(
                    account,
                    scalingFactor.mul(tokensTransferred),
                    opts
                );
            }));
            await Promise.all(accounts.map((account) => {
                const opts = { from: account, gas: 4700000 };
                return erc20.approve(
                    ace.address,
                    scalingFactor.mul(tokensTransferred),
                    opts
                );
            }));
        });

        it('should update a note registry with output notes', async () => {
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
                validatorAddress: aztecJoinSplit.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            await ace.publicApprove(
                zkAsset.address,
                depositProofHash,
                transferAmount,
                { from: accounts[0] }
            );

            const { receipt } = await zkAsset.confidentialTransfer(depositProof.proofData);
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());

            console.log('gas used = ', receipt.gasUsed);
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(0, 2),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[0],
                kPublic: -10,
                validatorAddress: aztecJoinSplit.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const tokenWithdrawlProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(0, 2),
                outputNotes: notes.slice(2, 4),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(0, 2),
                publicOwner: accounts[1],
                kPublic: -40,
                validatorAddress: aztecJoinSplit.address,
            });

            const tokenWithdrawlProofOutput = outputCoder.getProofOutput(tokenWithdrawlProof.expectedOutput, 0);
            const tokenWithdrawlProofHash = outputCoder.hashProofOutput(tokenWithdrawlProofOutput);

            await ace.publicApprove(
                zkAsset.address,
                depositProofHash,
                10,
                { from: accounts[0] }
            );

            await ace.publicApprove(
                zkAsset.address,
                tokenWithdrawlProofHash,
                40,
                { from: accounts[1] }
            );

            await zkAsset.confidentialTransfer(depositProof.proofData);
            const { receipt } = await zkAsset.confidentialTransfer(tokenWithdrawlProof.proofData);
            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic positive', async () => {
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: notes.slice(6, 8),
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[2],
                kPublic: -130,
                validatorAddress: aztecJoinSplit.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const withdrawlAmount = 40;
            const withdrawlAmountBN = new BN(withdrawlAmount);

            const withdrawlAndTransferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: notes.slice(6, 8),
                outputNotes: notes.slice(4, 6),
                senderAddress: accounts[0],
                inputNoteOwners: aztecAccounts.slice(6, 8),
                publicOwner: accounts[2],
                kPublic: withdrawlAmount,
                validatorAddress: aztecJoinSplit.address,
            });

            const withdrawlAndTransferProofOutput = outputCoder.getProofOutput(withdrawlAndTransferProof.expectedOutput, 0);
            const withdrawlAndTransferProofHash = outputCoder.hashProofOutput(withdrawlAndTransferProofOutput);

            await ace.publicApprove(
                zkAsset.address,
                depositProofHash,
                130,
                { from: accounts[2] }
            );

            await ace.publicApprove(
                zkAsset.address,
                withdrawlAndTransferProofHash,
                40,
                { from: accounts[2] }
            );

            await zkAsset.confidentialTransfer(depositProof.proofData);

            const balancePreWithdrawl = await erc20.balanceOf(accounts[2]);
            const expectedBalancePostWithdrawl = balancePreWithdrawl.add(withdrawlAmountBN.mul(scalingFactor));
            const { receipt } = await zkAsset.confidentialTransfer(withdrawlAndTransferProof.proofData);
            const balancePostWithdrawl = await erc20.balanceOf(accounts[2]);
            expect(balancePostWithdrawl.toString()).to.equal(expectedBalancePostWithdrawl.toString());

            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            const depositProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [],
                outputNotes: [notes[0], notes[3]],
                senderAddress: accounts[0],
                inputNoteOwners: [],
                publicOwner: accounts[3],
                kPublic: -30,
                validatorAddress: aztecJoinSplit.address,
            });

            const depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
            const depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

            const transferProof = proof.joinSplit.encodeJoinSplitTransaction({
                inputNotes: [notes[0], notes[3]],
                outputNotes: [notes[1], notes[2]],
                senderAddress: accounts[0],
                inputNoteOwners: [aztecAccounts[0], aztecAccounts[3]],
                publicOwner: accounts[3],
                kPublic: 0, // perfectly balanced...
                validatorAddress: aztecJoinSplit.address,
            });

            await ace.publicApprove(
                zkAsset.address,
                depositProofHash,
                30,
                { from: accounts[3] }
            );

            await zkAsset.confidentialTransfer(depositProof.proofData);
            const { receipt } = await zkAsset.confidentialTransfer(transferProof.proofData);
            expect(receipt.status).to.equal(true);
        });
    });
});
