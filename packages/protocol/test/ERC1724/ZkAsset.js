/* global artifacts, expect, contract, beforeEach, it:true */
const { JoinSplitProof, note, signer } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const {
    constants,
    proofs: { JOIN_SPLIT_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const BN = require('bn.js');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft } = require('web3-utils');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const ZkAsset = artifacts.require('./ZkAsset');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

let joinSplitValidator;

const computeDomainHash = (validatorAddress) => {
    const types = { EIP712Domain: constants.eip712.EIP712_DOMAIN };
    const domain = signer.generateZKAssetDomainParams(validatorAddress);
    return keccak256(`0x${typedData.encodeMessageData(types, 'EIP712Domain', domain)}`);
};

const randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};

const setupSingleProofTest = async (noteValues) => {
    const numNotes = noteValues.length;
    const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
    const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

    const inputNotes = [];
    const outputNotes = notes.slice(0, 2);
    const inputNoteOwnerAccounts = [];

    return {
        inputNotes,
        inputNoteOwnerAccounts,
        outputNotes,
    };
};

const setupTwoProofTest = async (noteValues) => {
    const numNotes = noteValues.length;
    const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
    const notes = await Promise.all([...aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i]))]);

    const depositInputNotes = [];
    const depositOutputNotes = notes.slice(0, 2);
    const depositInputOwnerAccounts = [];

    const withdrawalInputNotes = depositOutputNotes;
    const withdrawalOutputNotes = notes.slice(2, 4);
    const withdrawalInputNoteOwnerAccounts = aztecAccounts.slice(0, 2);

    return {
        depositInputNotes,
        depositOutputNotes,
        depositInputOwnerAccounts,
        withdrawalInputNotes,
        withdrawalOutputNotes,
        withdrawalInputNoteOwnerAccounts,
    };
};

contract('ZkAsset', (accounts) => {
    let ace;
    let erc20;

    const canAdjustSupply = false;
    const canConvert = true;

    const sender = accounts[0];
    const publicOwner = accounts[0];
    const scalingFactor = new BN(10);
    const tokensTransferred = new BN(100000);

    beforeEach(async () => {
        ace = await ACE.new({ from: accounts[0] });
        erc20 = await ERC20Mintable.new({ from: accounts[0] });
        joinSplitValidator = await JoinSplitValidator.new({ from: sender });

        await ace.setCommonReferenceString(bn128.CRS);
        await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);

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
            const noteValues = [0, 10];
            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await setupSingleProofTest(noteValues);

            const transferAmount = 10;
            const publicValue = transferAmount * -1;

            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, inputNoteOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(transferAmount);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, transferAmount, { from: accounts[0] });
            const { receipt } = await zkAsset.confidentialTransfer(data, signatures, { from: accounts[0] });
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should update a note registry by consuming input notes, with kPublic negative', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const depositPublicValue = -60;
            const withdrawalPublicValue = 10;

            const noteValues = [50, 10, 20, 30];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
                withdrawalInputNoteOwnerAccounts,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);
            const withdrawalSignatures = withdrawalProof.constructSignatures(zkAsset.address, withdrawalInputNoteOwnerAccounts);

            await ace.publicApprove(zkAsset.address, withdrawalProof.hash, withdrawalPublicValue, { from: accounts[0] });
            const { receipt } = await zkAsset.confidentialTransfer(withdrawalData, withdrawalSignatures);
            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry by consuming input notes, with kPublic positive', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const depositPublicValue = -130;
            const withdrawalPublicValue = 40;

            const noteValues = [70, 60, 50, 40];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
                withdrawalInputNoteOwnerAccounts,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, 130, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );
            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);
            const withdrawalSignatures = withdrawalProof.constructSignatures(zkAsset.address, withdrawalInputNoteOwnerAccounts);

            await ace.publicApprove(zkAsset.address, withdrawalProof.hash, 40, { from: accounts[0] });

            const balancePreWithdrawal = await erc20.balanceOf(accounts[0]);
            const expectedBalancePostWithdrawal = balancePreWithdrawal.add(new BN(withdrawalPublicValue).mul(scalingFactor));

            const { receipt } = await zkAsset.confidentialTransfer(withdrawalData, withdrawalSignatures);

            const balancePostWithdrawal = await erc20.balanceOf(accounts[0]);
            expect(balancePostWithdrawal.toString()).to.equal(expectedBalancePostWithdrawal.toString());

            expect(receipt.status).to.equal(true);
        });

        it('should update a note registry with kPublic = 0', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);

            const depositPublicValue = -30;
            const transferPublicValue = 0;

            const noteValues = [5, 25, 17, 13];

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
                withdrawalInputNoteOwnerAccounts,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const transferProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                transferPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(joinSplitValidator.address);
            const transferSignatures = transferProof.constructSignatures(zkAsset.address, withdrawalInputNoteOwnerAccounts);
            const { receipt } = await zkAsset.confidentialTransfer(transferData, transferSignatures);
            expect(receipt.status).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('should fail if the ace fails to validate the proof', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [0, 10];
            const depositPublicValue = -10;

            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await setupSingleProofTest(noteValues);

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, sender, depositPublicValue, publicOwner);

            const data = depositProof.encodeABI(zkAsset.address);
            const signatures = depositProof.constructSignatures(zkAsset.address, inputNoteOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            const malformedProofData = `0x0123${data.slice(6)}`;
            // no error message because it throws in assembly
            await truffleAssert.reverts(zkAsset.confidentialTransfer(malformedProofData, signatures));
        });

        it('should fail if signatures are zero', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [10, 20, 5, 25];
            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);

            const length = 64;
            const zeroSignature = new Array(length).fill(0).join('');
            const zeroSignatures = `0x${zeroSignature + zeroSignature + zeroSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(withdrawalData, zeroSignatures));
        });

        it('should fail if fake signatures are provided', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [10, 20, 5, 25];

            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);

            const fakeSignature = padLeft(crypto.randomBytes(32).toString('hex'));
            const fakeSignatures = `0x${fakeSignature + fakeSignature + fakeSignature}`;

            await truffleAssert.reverts(zkAsset.confidentialTransfer(withdrawalData, fakeSignatures));
        });

        it('should fail if different note owner signs the transaction', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [10, 20, 5, 25];
            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const fakeInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);
            const fakeWithdrawalSignatures = withdrawalProof.constructSignatures(zkAsset.address, fakeInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(withdrawalData, fakeWithdrawalSignatures));
        });

        it('should fail if validator address is fake', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [10, 20, 5, 25];
            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const randomValidatorAddress = randomAddress();
            const depositSignatures = depositProof.constructSignatures(randomValidatorAddress, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const fakeInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);
            const fakeWithdrawalSignatures = withdrawalProof.constructSignatures(zkAsset.address, fakeInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(withdrawalData, fakeWithdrawalSignatures));
        });

        it('should fail if validator address is the joinSplit address', async () => {
            const zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, canAdjustSupply, canConvert);
            const noteValues = [10, 20, 5, 25];
            const depositPublicValue = -30;
            const withdrawalPublicValue = 0;

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                withdrawalInputNotes,
                withdrawalOutputNotes,
            } = await setupTwoProofTest(noteValues);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );

            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(joinSplitValidator.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: accounts[0] });
            await zkAsset.confidentialTransfer(depositData, depositSignatures);

            const fakeInputNoteOwners = [secp256k1.generateAccount(), secp256k1.generateAccount()];

            const withdrawalProof = new JoinSplitProof(
                withdrawalInputNotes,
                withdrawalOutputNotes,
                sender,
                withdrawalPublicValue,
                publicOwner,
            );

            const withdrawalData = withdrawalProof.encodeABI(zkAsset.address);
            const fakeWithdrawalSignatures = withdrawalProof.constructSignatures(zkAsset.address, fakeInputNoteOwners);

            await truffleAssert.reverts(zkAsset.confidentialTransfer(withdrawalData, fakeWithdrawalSignatures));
        });
    });
});
