/* global artifacts, expect, contract, beforeEach, it:true */
const { MintProof, JoinSplitProof, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const { JOIN_SPLIT_PROOF, MINT_PROOF } = devUtils.proofs;

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
const JoinSplitFluidValidator = artifacts.require('./JoinSplitFluid');
const JoinSplitFluidValidatorInterface = artifacts.require('./JoinSplitFluidInterface');
const ZkAssetMintable = artifacts.require('./ZkAssetMintable');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;
JoinSplitFluidValidator.abi = JoinSplitFluidValidatorInterface.abi;

const aztecAccount = secp256k1.generateAccount();
const { publicKey } = aztecAccount;

const getDefaultMintNotes = async () => {
    const newMintCounter = 50;
    const mintedNoteValues = [20, 30];

    const zeroMintCounterNote = await note.createZeroValueNote();
    const newMintCounterNote = await note.create(publicKey, newMintCounter);
    const mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
    return { zeroMintCounterNote, newMintCounterNote, mintedNotes };
};

const getCustomMintNotes = async (newMintCounterValue, mintedNoteValues) => {
    const zeroMintCounterNote = await note.createZeroValueNote();
    const newMintCounterNote = await note.create(publicKey, newMintCounterValue);
    const mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
    return { zeroMintCounterNote, newMintCounterNote, mintedNotes };
};

contract('ZkAssetMintable', (accounts) => {
    describe('Success States', () => {
        let ace;
        let joinSplitFluidValidator;
        let joinSplitValidator;
        let erc20;
        let scalingFactor;
        const publicOwner = accounts[0];

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });
            joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: accounts[0] });

            await ace.setCommonReferenceString(bn128.CRS);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);
            await ace.setProof(MINT_PROOF, joinSplitFluidValidator.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
        });

        it('should complete a mint operation', async () => {
            const zkAssetMintable = await ZkAssetMintable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });

            const sender = zkAssetMintable.address;
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const { receipt } = await zkAssetMintable.confidentialMint(MINT_PROOF, data, { from: accounts[0] });
            expect(receipt.status).to.equal(true);
        });

        it('should transfer minted value out of the note registry', async () => {
            const zkAssetMintable = await ZkAssetMintable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });

            const withdrawalPublicValue = 50;
            const erc20TotalSupply = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupply).to.equal(0);
            const initialBalance = (await erc20.balanceOf(accounts[1])).toNumber();

            const mintSender = zkAssetMintable.address;
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();

            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, mintSender);
            const data = proof.encodeABI();
            const { receipt: mintReceipt } = await zkAssetMintable.confidentialMint(MINT_PROOF, data);
            expect(mintReceipt.status).to.equal(true);

            const erc20TotalSupplyAfterMint = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterMint).to.equal(0);

            const withdrawSender = accounts[0];

            const withdrawalProof = new JoinSplitProof(mintedNotes, [], withdrawSender, withdrawalPublicValue, publicOwner);
            const withdrawalData = withdrawalProof.encodeABI(zkAssetMintable.address);
            const withdrawalSignatures = withdrawalProof.constructSignatures(zkAssetMintable.address, [
                aztecAccount,
                aztecAccount,
            ]);
            const { receipt: transferReceipt } = await zkAssetMintable.confidentialTransfer(withdrawalData, withdrawalSignatures);

            const erc20TotalSupplyAfterWithdrawal = (await erc20.totalSupply()).toNumber();
            expect(erc20TotalSupplyAfterWithdrawal).to.equal(withdrawalPublicValue * scalingFactor);
            const finalBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            expect(transferReceipt.status).to.equal(true);
            expect(initialBalance).to.equal(0);
            expect(finalBalance).to.equal(withdrawalPublicValue * scalingFactor);
        });
    });

    describe('Failure States', () => {
        let ace;
        let erc20;
        let scalingFactor;
        let joinSplitFluidValidator;
        let joinSplitValidator;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });
            joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: accounts[0] });

            await ace.setCommonReferenceString(bn128.CRS);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);
            await ace.setProof(MINT_PROOF, joinSplitFluidValidator.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
        });

        it('should fail if msg.sender is not owner', async () => {
            const zkAssetMintable = await ZkAssetMintable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });

            const sender = zkAssetMintable.address;
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, data, { from: accounts[1] }));
        });

        it('should fail for unbalanced proof relation, totalInputs !== totalOutputs', async () => {
            const zkAssetMintable = await ZkAssetMintable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });
            const sender = zkAssetMintable.address;
            const newMintCounterValue = 50;
            const mintedNoteValues = [30, 30];
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getCustomMintNotes(
                newMintCounterValue,
                mintedNoteValues,
            );
            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(zkAssetMintable.confidentialMint(MINT_PROOF, data));
        });
    });
});
