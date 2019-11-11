/* global artifacts, expect, contract, it:true */
const {
    BurnProof,
    DividendProof,
    JoinSplitProof,
    MintProof,
    note,
    PrivateRangeProof,
    PublicRangeProof,
    signer,
    SwapProof,
} = require('aztec.js');
const bn128 = require('@aztec/bn128');
const {
    proofs: { BURN_PROOF, DIVIDEND_PROOF, JOIN_SPLIT_PROOF, SWAP_PROOF, MINT_PROOF, PRIVATE_RANGE_PROOF, PUBLIC_RANGE_PROOF },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const BN = require('bn.js');
const { getNotesForAccount } = require('../helpers/ERC1724');
const factoryHelpers = require('../helpers/Factory');

const ACE = artifacts.require('./ACE');
const DividendValidator = artifacts.require('./Dividend');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./Joinsplit');
const PublicRangeValidator = artifacts.require('./PublicRange');
const PrivateRangeValidator = artifacts.require('./PrivateRange');
const SwapValidator = artifacts.require('./Swap');
const TestFactory = artifacts.require('./test/TestFactory');
const ZkAsset = artifacts.require('./zkAssetAdjustable');

contract('AZTEC integration', (accounts) => {
    let ace;
    let dividendValidator;
    let erc20;
    let factoryContract;
    let joinSplitValidator;
    let privateRangeValidator;
    let publicRangeValidator;
    let swapValidator;
    let zkAsset;
    let aztecAccount;
    const scalingFactor = new BN(1);
    const publicOwner = accounts[0];

    before(async () => {
        // instantiate all deployed contracts
        ace = await ACE.at(ACE.address);
        dividendValidator = await DividendValidator.at(DividendValidator.address);
        joinSplitValidator = await JoinSplitValidator.at(JoinSplitValidator.address);
        privateRangeValidator = await PrivateRangeValidator.at(PrivateRangeValidator.address);
        publicRangeValidator = await PublicRangeValidator.at(PublicRangeValidator.address);
        swapValidator = await SwapValidator.at(SwapValidator.address);

        erc20 = await ERC20Mintable.at(ERC20Mintable.address);
        factoryContract = await TestFactory.new(ace.address);
        zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor, 0, []);
        aztecAccount = secp256k1.generateAccount();

        // Fund account with ERC20s
        const tokensTransferred = new BN(500);
        await erc20.mint(publicOwner, scalingFactor.mul(tokensTransferred));
        await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));
    });

    describe('Initialisation', async () => {
        it('should have set ACE owner', async () => {
            const owner = await ace.owner();
            expect(owner).to.equal(accounts[0]);
        });

        it('should have set ACE common reference string', async () => {
            const aceCRS = await ace.getCommonReferenceString();
            expect(aceCRS).to.deep.equal(bn128.CRS);
        });

        it('should have set ACE proofs', async () => {
            const joinSplitValidatorAddress = await ace.getValidatorAddress(JOIN_SPLIT_PROOF);
            expect(joinSplitValidatorAddress).to.equal(joinSplitValidator.address);

            const dividendValidatorAddress = await ace.getValidatorAddress(DIVIDEND_PROOF);
            expect(dividendValidatorAddress).to.equal(dividendValidator.address);

            const privateRangeValidatorAddress = await ace.getValidatorAddress(PRIVATE_RANGE_PROOF);
            expect(privateRangeValidatorAddress).to.equal(privateRangeValidator.address);

            const publicRangeValidatorAddress = await ace.getValidatorAddress(PUBLIC_RANGE_PROOF);
            expect(publicRangeValidatorAddress).to.equal(publicRangeValidator.address);

            const swapValidatorAddress = await ace.getValidatorAddress(SWAP_PROOF);
            expect(swapValidatorAddress).to.equal(swapValidator.address);
        });

        it('should have set zkAsset linkedToken', async () => {
            const linkedTokenAddress = await zkAsset.linkedToken();
            expect(linkedTokenAddress).to.equal(erc20.address);
        });

        it('should have set zkAsset owner', async () => {
            const zkAssetOwner = await zkAsset.owner();
            expect(zkAssetOwner).to.equal(accounts[0]);
        });
    });

    describe.only('Key flows', async () => {
        const sender = accounts[0];

        it('should verify a dividend proof', async () => {
            const za = 100;
            const zb = 5;
            const notionalNote = await note.create(aztecAccount.publicKey, 90);
            const residualNote = await note.create(aztecAccount.publicKey, 4);
            const targetNote = await note.create(aztecAccount.publicKey, 50);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            const { receipt } = await ace.validateProof(DIVIDEND_PROOF, sender, data);
            expect(receipt.status).to.equal(true);
        });

        it('should verify a private range proof', async () => {
            const originalNote = await note.create(aztecAccount.publicKey, 10);
            const comparisonNote = await note.create(aztecAccount.publicKey, 4);
            const utilityNote = await note.create(aztecAccount.publicKey, 6);

            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const data = proof.encodeABI();
            const { receipt } = await ace.validateProof(PRIVATE_RANGE_PROOF, sender, data);
            expect(receipt.status).to.equal(true);
        });

        it('should verify a public range range proof', async () => {
            const originalNote = await note.create(aztecAccount.publicKey, 50);
            const utilityNote = await note.create(aztecAccount.publicKey, 40);
            const publicComparison = 10;
            const isGreaterOrEqual = true;

            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            const data = proof.encodeABI();
            const { receipt } = await ace.validateProof(PUBLIC_RANGE_PROOF, sender, data);
            expect(receipt.status).to.equal(true);
        });

        it.only('should verify a swap proof ', async () => {
            const asks = [10, 20];
            const bids = [10, 20];
            const maker = secp256k1.generateAccount();
            const taker = secp256k1.generateAccount();

            const inputNotes = [
                await note.create(maker.publicKey, bids[0]),
                await note.create(taker.publicKey, bids[1]),
            ];

            const outputNotes = [
                await note.create(maker.publicKey, asks[0]),
                await note.create(taker.publicKey, asks[1]),
            ];

            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();
            const { receipt } = await ace.validateProof(SWAP_PROOF, sender, data);
            expect(receipt.status).to.equal(true);
        });

        it('should perform a confidentialTransfer(), with a deposit proof', async () => {
            // Convert 100 tokens into two output notes
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [50, 50]);
            const depositPublicValue = 100;
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            const balancePreTransfer = await erc20.balanceOf(publicOwner);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            await ace.publicApprove(zkAsset.address, proof.hash, depositPublicValue, { from: publicOwner });
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: sender,
            });
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(publicOwner);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should perform a confidentialTransfer(), with a withdraw proof', async () => {
            // Convert tokens into notes, then withdraw those notes

            // convert tokens into notes
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [50, 50]);
            const depositPublicValue = 100;
            const publicValue = depositPublicValue * -1;

            const depositProof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAsset.address);
            const signatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, { from: publicOwner });
            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, signatures, {
                from: sender,
            });

            const balancePostDeposit = await erc20.balanceOf(publicOwner);

            // withdraw notes into tokens
            const withdrawInputNotes = depositOutputNotes;
            const withdrawInputOwnerAccounts = [aztecAccount, aztecAccount];
            const withdrawOutputNotes = [];
            const withdrawPublicValue = 100;

            const withdrawAmountBN = new BN(withdrawPublicValue);
            const expectedBalancePostWithdraw = balancePostDeposit.add(withdrawAmountBN.mul(scalingFactor));

            const withdrawProof = new JoinSplitProof(
                withdrawInputNotes,
                withdrawOutputNotes,
                sender,
                withdrawPublicValue,
                publicOwner,
            );
            const withdrawData = withdrawProof.encodeABI(zkAsset.address);
            const withdrawSignatures = withdrawProof.constructSignatures(zkAsset.address, withdrawInputOwnerAccounts);

            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](withdrawData, withdrawSignatures, {
                from: sender,
            });

            const balancePostWithdraw = await erc20.balanceOf(publicOwner);
            expect(balancePostWithdraw.toString()).to.equal(expectedBalancePostWithdraw.toString());
        });

        it('should perform a mint operation', async () => {
            // Mint 3 AZTEC notes, worth a total of 300 tokens
            const newMintCounter = 50;
            const mintedNoteValues = [20, 30];

            const zeroMintCounterNote = await note.createZeroValueNote();
            const newMintCounterNote = await note.create(aztecAccount.publicKey, newMintCounter);
            const mintedNotes = await getNotesForAccount(aztecAccount, mintedNoteValues);

            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const { receipt } = await zkAsset.confidentialMint(MINT_PROOF, data, { from: accounts[0] });
            expect(receipt.status).to.equal(true);
        });

        it('should be able to burn minted value', async () => {
            // Mint 3 AZTEC notes, worth a total of 300 tokens
            const newMintCounter = 100;
            const mintedNoteValues = [80, 20];

            const zeroMintCounterNote = await note.createZeroValueNote();
            const newMintCounterNote = await note.create(aztecAccount.publicKey, newMintCounter);
            const mintedNotes = await getNotesForAccount(aztecAccount, mintedNoteValues);

            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            await zkAsset.confidentialMint(MINT_PROOF, data, { from: accounts[0] });

            const newBurnCounterNote = await note.create(aztecAccount.publicKey, newMintCounter);
            const zeroBurnCounterNote = await note.createZeroValueNote();

            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, mintedNotes, sender);
            const burnData = burnProof.encodeABI(zkAsset.address);

            const { receipt: burnReceipt } = await zkAsset.confidentialBurn(BURN_PROOF, burnData);
            expect(burnReceipt.status).to.equal(true);
        });

        it('should delegate note spending control using a confidentialApprove() and allow a confidentialTransferFrom()', async () => {
            // Call confidentialApprove() on two notes to approve the zkAsset to spend on user's behalf
            const delegatedAddress = accounts[3];

            const depositInputNotes = [];
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [50, 10]);
            const depositPublicValue = -60;
            const depositInputOwnerAccounts = [];

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                sender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAsset.address);
            const depositSignatures = depositProof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);

            await ace.publicApprove(zkAsset.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });

            await zkAsset.methods['confidentialTransfer(bytes,bytes)'](depositData, depositSignatures, {
                from: accounts[0],
            });

            const transferInputNotes = depositOutputNotes;
            const transferOutputNotes = await getNotesForAccount(aztecAccount, [20, 30]);
            const withdrawalPublicValue = 10;

            const transferProof = new JoinSplitProof(
                transferInputNotes,
                transferOutputNotes,
                delegatedAddress,
                withdrawalPublicValue,
                publicOwner,
            );
            const transferData = transferProof.encodeABI(zkAsset.address);

            const signature1 = signer.signNoteForConfidentialApprove(
                zkAsset.address,
                transferInputNotes[0].noteHash,
                delegatedAddress,
                true,
                aztecAccount.privateKey,
            );
            await zkAsset.confidentialApprove(transferInputNotes[0].noteHash, delegatedAddress, true, signature1);

            const signature2 = signer.signNoteForConfidentialApprove(
                zkAsset.address,
                transferInputNotes[1].noteHash,
                delegatedAddress,
                true,
                aztecAccount.privateKey,
            );
            await zkAsset.confidentialApprove(transferInputNotes[1].noteHash, delegatedAddress, true, signature2);

            await ace.validateProof(JOIN_SPLIT_PROOF, delegatedAddress, transferData, { from: delegatedAddress });
            const { receipt } = await zkAsset.confidentialTransferFrom(JOIN_SPLIT_PROOF, transferProof.eth.output, {
                from: delegatedAddress,
            });
            expect(receipt.status).to.equal(true);
        });

        it('should perform a note registry upgrade', async () => {
            const zkAssetOwner = accounts[0];

            const existingProxy = await ace.registries(zkAssetOwner);
            const newFactoryId = factoryHelpers.generateFactoryId(1, 3, 3);
            const newFactoryContract = await TestFactory.new(ace.address);

            await ace.setFactory(newFactoryId, newFactoryContract.address, { from: sender });
            console.log('set factory');

            const preUpgradeBehaviour = await factoryContract.getImplementation.call(existingProxy.behaviour);

            await zkAsset.upgradeRegistryVersion(newFactoryId, { from: zkAssetOwner });
            console.log('performed upgrade registry version');

            const postUpgradeProxy = await ace.registries(zkAssetOwner);
            expect(postUpgradeProxy.behaviour).to.equal(existingProxy.behaviour);

            const newBehaviourAddress = await newFactoryContract.getImplementation.call(existingProxy.behaviour);
            expect(newBehaviourAddress).to.not.equal(preUpgradeBehaviour);
        });
    });
});
