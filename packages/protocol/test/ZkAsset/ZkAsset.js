/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');

// ### Internal Dependencies
// eslint-disable-next-line object-curly-newline
const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const { constants, proofs: { JOIN_SPLIT_PROOF } } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');
const { keccak256 } = require('web3-utils');

const { outputCoder } = abiEncoder;

// ### Artifacts
const ERC20Mintable = artifacts.require('./contracts/ERC20/ERC20Mintable');
const ACE = artifacts.require('./contracts/ACE/ACE');
const JoinSplit = artifacts.require('./contracts/ACE/validators/JoinSplit');
const JoinSplitInterface = artifacts.require('./contracts/ACE/validators/JoinSplitInterface');
const ZkAsset = artifacts.require('./contracts/ZkAsset/ZkAsset');


JoinSplit.abi = JoinSplitInterface.abi;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = sign.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${sign.eip712.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

contract('ZkAsset', (accounts) => {
    describe('success states', () => {
        let ace;
        let aztecAccounts = [];
        let aztecJoinSplit;
        const canAdjustSupply = false;
        const canConvert = true;
        let erc20;
        let notes = [];
        const scalingFactor = new BN(10);
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

        describe('success states', async () => {
            it('should correctly compute the domain hash', async () => {
                const domainHash = computeDomainHash(zkAsset.address);
                const result = await zkAsset.EIP712_DOMAIN_HASH();
                expect(result).to.equal(domainHash);
            });

            it('should correctly set the flags', async () => {
                const result = await zkAsset.flags();
                expect(result.active).to.equal(true);
                expect(result.canAdjustSupply).to.equal(false);
                expect(result.canConvert).to.equal(true);
            });

            it('should correctly set the linked token', async () => {
                const result = await zkAsset.linkedToken();
                expect(result).to.equal(erc20.address);
            });

            it('should correctly set the scaling factor', async () => {
                const result = await zkAsset.scalingFactor();
                expect(result.toNumber()).to.equal(scalingFactor.toNumber());
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

                const tokenWithdrawalProof = proof.joinSplit.encodeJoinSplitTransaction({
                    inputNotes: notes.slice(0, 2),
                    outputNotes: notes.slice(2, 4),
                    senderAddress: accounts[0],
                    inputNoteOwners: aztecAccounts.slice(0, 2),
                    publicOwner: accounts[1],
                    kPublic: -40,
                    validatorAddress: aztecJoinSplit.address,
                });

                const tokenWithdrawalProofOutput = outputCoder.getProofOutput(tokenWithdrawalProof.expectedOutput, 0);
                const tokenWithdrawalProofHash = outputCoder.hashProofOutput(tokenWithdrawalProofOutput);

                await ace.publicApprove(
                    zkAsset.address,
                    depositProofHash,
                    10,
                    { from: accounts[0] }
                );

                await ace.publicApprove(
                    zkAsset.address,
                    tokenWithdrawalProofHash,
                    40,
                    { from: accounts[1] }
                );

                await zkAsset.confidentialTransfer(depositProof.proofData);
                const { receipt } = await zkAsset.confidentialTransfer(tokenWithdrawalProof.proofData);
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

                const withdrawalAmount = 40;
                const withdrawalAmountBN = new BN(withdrawalAmount);

                const withdrawalAndTransferProof = proof.joinSplit.encodeJoinSplitTransaction({
                    inputNotes: notes.slice(6, 8),
                    outputNotes: notes.slice(4, 6),
                    senderAddress: accounts[0],
                    inputNoteOwners: aztecAccounts.slice(6, 8),
                    publicOwner: accounts[2],
                    kPublic: withdrawalAmount,
                    validatorAddress: aztecJoinSplit.address,
                });

                const withdrawalAndTransferProofOutput = outputCoder.getProofOutput(withdrawalAndTransferProof.expectedOutput, 0);
                const withdrawalAndTransferProofHash = outputCoder.hashProofOutput(withdrawalAndTransferProofOutput);

                await ace.publicApprove(
                    zkAsset.address,
                    depositProofHash,
                    130,
                    { from: accounts[2] }
                );

                await ace.publicApprove(
                    zkAsset.address,
                    withdrawalAndTransferProofHash,
                    40,
                    { from: accounts[2] }
                );

                await zkAsset.confidentialTransfer(depositProof.proofData);

                const balancePreWithdrawal = await erc20.balanceOf(accounts[2]);
                const expectedBalancePostWithdrawal = balancePreWithdrawal.add(withdrawalAmountBN.mul(scalingFactor));
                const { receipt } = await zkAsset.confidentialTransfer(withdrawalAndTransferProof.proofData);
                const balancePostWithdrawal = await erc20.balanceOf(accounts[2]);
                expect(balancePostWithdrawal.toString()).to.equal(expectedBalancePostWithdrawal.toString());

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

        describe('failure states', async () => {
            it('should fail if the ace fails to validate the proof', async () => {
                const transferAmount = 10;

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
                const malformedProofData = `0x0123${depositProof.proofData.slice(6)}`;
                // no error message because it throws in assembly
                await truffleAssert.reverts(zkAsset.confidentialTransfer(malformedProofData));
            });
        });
    });
});
