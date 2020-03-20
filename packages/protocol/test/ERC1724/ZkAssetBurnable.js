/* global artifacts, expect, contract, beforeEach, it:true */
const { BurnProof, JoinSplitProof, note } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const helpers = require('../helpers/ERC1724');

const { BURN_PROOF } = devUtils.proofs;

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
const JoinSplitFluidValidator = artifacts.require('./JoinSplitFluid');
const JoinSplitFluidValidatorInterface = artifacts.require('./JoinSplitFluidInterface');
const ZkAssetBurnable = artifacts.require('./ZkAssetBurnable');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;
JoinSplitFluidValidator.abi = JoinSplitFluidValidatorInterface.abi;

const userA = secp256k1.generateAccount();

const getDefaultDepositAndBurnNotes = async () => {
    // There is no input note, as value is being deposited into ACE with an output
    // note being created
    const depositOutputNoteValues = [30, 20];
    const depositPublicValue = -50;

    const depositNotes = await helpers.getDepositNotes(depositOutputNoteValues);

    const newBurnCounterValue = 50;
    const newBurnCounterNote = await note.create(userA.publicKey, newBurnCounterValue);
    const zeroBurnCounterNote = await note.createZeroValueNote();
    const burnNotes = depositNotes.depositOutputNotes;

    return {
        ...depositNotes,
        depositPublicValue,
        newBurnCounterNote,
        zeroBurnCounterNote,
        burnNotes,
    };
};

contract('ZkAssetBurnable', (accounts) => {
    const depositSender = accounts[0];

    describe('Success States', () => {
        let ace;
        let erc20;
        let scalingFactor;

        beforeEach(async () => {
            ace = await ACE.at(ACE.address);
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            scalingFactor = new BN(10);
        });

        it('should transfer public value in, then burn it', async () => {
            const zkAssetBurnable = await ZkAssetBurnable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                depositPublicValue,
                newBurnCounterNote,
                zeroBurnCounterNote,
                burnNotes,
            } = await getDefaultDepositAndBurnNotes();

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const linkedTokenInitialBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            const aceInitialBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(linkedTokenInitialBalance).to.equal(scalingFactor.mul(tokensTransferred).toNumber());
            expect(aceInitialBalance).to.equal(0);

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                depositSender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });
            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);
            expect(joinSplitReceipt.status).to.equal(true);

            const linkedTokenIntermediatateBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            const expectedLinkedTokenIntermediateBalance = tokensTransferred
                .mul(scalingFactor)
                .sub(new BN(-depositPublicValue).mul(scalingFactor))
                .toNumber();
            expect(linkedTokenIntermediatateBalance).to.equal(expectedLinkedTokenIntermediateBalance);
            const aceIntermediateBalance = (await erc20.balanceOf(ace.address)).toNumber();
            const expectedAceIntermediateBalance = new BN(-depositPublicValue).mul(scalingFactor).toNumber();
            expect(aceIntermediateBalance).to.equal(expectedAceIntermediateBalance);

            const [burnSender] = accounts;
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            const { receipt: burnReceipt } = await zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData);
            expect(burnReceipt.status).to.equal(true);

            const aceBalanceFinal = (await erc20.balanceOf(ace.address)).toNumber();
            const linkedTokenFinalBalance = (await erc20.balanceOf(accounts[0])).toNumber();

            const expectedAceBalanceFinal = new BN(-depositPublicValue).mul(scalingFactor).toNumber();
            expect(aceBalanceFinal).to.equal(expectedAceBalanceFinal);
            const expectedLinkedTokenFinalBalance = tokensTransferred
                .mul(scalingFactor)
                .sub(new BN(-depositPublicValue).mul(scalingFactor))
                .toNumber();
            expect(linkedTokenFinalBalance).to.equal(expectedLinkedTokenFinalBalance);
        });
    });

    describe('Failure States', () => {
        let ace;
        let erc20;
        let scalingFactor;

        beforeEach(async () => {
            ace = await ACE.at(ACE.address);
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            scalingFactor = new BN(1);
        });

        it('should fail if confidentialBurn() called from a non-owner', async () => {
            const zkAssetBurnable = await ZkAssetBurnable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });

            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                depositPublicValue,
                newBurnCounterNote,
                zeroBurnCounterNote,
                burnNotes,
            } = await getDefaultDepositAndBurnNotes();

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                depositSender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });
            await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);

            const [burnSender] = accounts;
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData, { from: accounts[1] }));
        });

        it('should fail if balancing relationship in burn proof not satisfied', async () => {
            const zkAssetBurnable = await ZkAssetBurnable.new(ace.address, erc20.address, scalingFactor, {
                from: accounts[0],
            });
            const {
                depositInputNotes,
                depositOutputNotes,
                depositInputOwnerAccounts,
                depositPublicValue,
                newBurnCounterNote,
                zeroBurnCounterNote,
                burnNotes,
            } = await getDefaultDepositAndBurnNotes();

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const depositProof = new JoinSplitProof(
                depositInputNotes,
                depositOutputNotes,
                depositSender,
                depositPublicValue,
                publicOwner,
            );
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, depositInputOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositPublicValue, {
                from: accounts[0],
            });
            await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);

            const [burnSender] = accounts;

            // Change a value of the burnedNote such that it doesn't satisfy a balancing relationship
            burnNotes[0] = await note.create(secp256k1.generateAccount().publicKey, 31);
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData, { from: accounts[1] }));
        });
    });
});
