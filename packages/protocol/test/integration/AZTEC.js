/* global artifacts, expect, contract, it:true */
const { JoinSplitProof, signer, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const {
    constants,
    proofs: {
        DIVIDEND_PROOF,
        JOIN_SPLIT_PROOF,
        SWAP_PROOF,
        PRIVATE_RANGE_PROOF,
        PUBLIC_RANGE_PROOF,
    },
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const BN = require('bn.js');
const { getNotesForAccount } = require('../helpers/ERC1724')

const ACE = artifacts.require('./ACE');
const DividendValidator = artifacts.require('./Dividend');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./Joinsplit');
const PublicRangeValidator = artifacts.require('./PublicRange');
const PrivateRangeValidator = artifacts.require('./PrivateRange');
const SwapValidator = artifacts.require('./Swap')
const ZkAsset = artifacts.require('./ZkAsset');


contract('AZTEC integration', (accounts) => {
    let ace;
    let dividendValidator;
    let erc20;
    let joinSplitValidator;
    let privateRangeValidator;
    let publicRangeValidator;
    let swapValidator;
    let zkAsset;
    let aztecAccount;
    const scalingFactor = new BN(1);


    before(async () => {
        // instantiate all deployed contracts
        ace = await ACE.at(ACE.address);
        dividendValidator = await DividendValidator.at(DividendValidator.address);
        joinSplitValidator = await JoinSplitValidator.at(JoinSplitValidator.address);
        privateRangeValidator = await PrivateRangeValidator.at(PrivateRangeValidator.address);
        publicRangeValidator = await PublicRangeValidator.at(PublicRangeValidator.address);
        swapValidator = await SwapValidator.at(SwapValidator.address);


        erc20 = await ERC20Mintable.at(ERC20Mintable.address);
        zkAsset = await ZkAsset.new(ace.address, erc20.address, scalingFactor);
        aztecAccount = secp256k1.generateAccount();
    });

    describe.only('Initialisation', async () => {
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

        it('should have set ZkAsset linkedToken', async () => {
            const linkedTokenAddress = await zkAsset.linkedToken();
            expect(linkedTokenAddress).to.equal(erc20.address);
        });

        it('should have set ZkAsset owner', async () => {
            // const zkAssetOwner = await zkAsset.owner();
            // expect(zkAssetOwner).to.equal(accounts[1])
        });

    });

    describe('Key flows', async () => {
        const sender = accounts[0];
        const publicOwner = accounts[2];

        it.only('should perform a confidentialTransfer(), with a deposit proof', async () => {
            // Convert 100 tokens into two output notes
            const depositInputNotes = [];
            const depositInputOwnerAccounts = [];
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [50, 50]);
            const depositPublicValue = 100;
            const publicValue = depositPublicValue * -1;

            const proof = new JoinSplitProof(depositInputNotes, depositOutputNotes, sender, publicValue, publicOwner);
            const data = proof.encodeABI(zkAsset.address);
            console.log('before construct signatures');
            const signatures = proof.constructSignatures(zkAsset.address, depositInputOwnerAccounts);
            console.log('constructed signatures')

            const balancePreTransfer = await erc20.balanceOf(accounts[0]);
            const transferAmountBN = new BN(depositPublicValue);
            const expectedBalancePostTransfer = balancePreTransfer.sub(transferAmountBN.mul(scalingFactor));

            console.log('constructed public approve')
            await ace.publicApprove(zkAsset.address, proof.hash, depositPublicValue, { from: accounts[0] });
            const { receipt } = await zkAsset.methods['confidentialTransfer(bytes,bytes)'](data, signatures, {
                from: accounts[0],
            });
            expect(receipt.status).to.equal(true);

            const balancePostTransfer = await erc20.balanceOf(accounts[0]);
            expect(balancePostTransfer.toString()).to.equal(expectedBalancePostTransfer.toString());
        });

        it('should perform a confidentialTransfer(), with a withdraw proof', async () => {
            // Convert 100 output notes into 100 ERC20 tokens
        });

        it('should perform a mint operation', async () => {
            // Mint 3 AZTEC notes, worth a total of 300 tokens
        });

        it('should perform a confidentialApprove() and allow a confidentialTransferFrom()', async () => {
            // Call confidentialApprove() on two notes to approve the ZkAsset to spend on user's behalf
        });

        it('should perform a note registry upgrade', async () => {
        });
    });
});
