/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { BurnProof, JoinSplitProof, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const { JOIN_SPLIT_PROOF, BURN_PROOF } = devUtils.proofs;

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');
const JoinSplitFluidValidator = artifacts.require('./JoinSplitFluid');
const JoinSplitFluidValidatorInterface = artifacts.require('./JoinSplitFluidInterface');
const ZkAssetBurnable = artifacts.require('./ZkAssetBurnable');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;
JoinSplitFluidValidator.abi = JoinSplitFluidValidatorInterface.abi;

const constructDepositNotes = async (noteValues) => {
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

contract('ZkAssetBurnable', (accounts) => {
    describe('Success States', () => {
        let ace;
        let joinSplitFluidValidator;
        let joinSplitValidator;
        let erc20;
        let scalingFactor;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });
            joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: accounts[0] });

            await ace.setCommonReferenceString(bn128.CRS);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);
            await ace.setProof(BURN_PROOF, joinSplitFluidValidator.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(10);
        });

        it('should transfer public value in, then burn it', async () => {
            const canAdjustSupply = true;
            const canConvert = true;
            const zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                {
                    from: accounts[0],
                },
            );

            const depositValue = 50;
            const depositSender = accounts[0];
            const noteValues = [30, 20];
            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await constructDepositNotes(noteValues);

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const linkedTokenInitialBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            const aceInitialBalance = (await erc20.balanceOf(ace.address)).toNumber();
            expect(linkedTokenInitialBalance).to.equal(scalingFactor.mul(tokensTransferred).toNumber());
            expect(aceInitialBalance).to.equal(0);

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, depositSender, -depositValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, inputNoteOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositValue, { from: accounts[0] });
            const { receipt: joinSplitReceipt } = await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);
            expect(joinSplitReceipt.status).to.equal(true);

            const linkedTokenIntermediatateBalance = (await erc20.balanceOf(accounts[0])).toNumber();
            const expectedLinkedTokenIntermediateBalance = tokensTransferred
                .mul(scalingFactor)
                .sub(new BN(depositValue).mul(scalingFactor))
                .toNumber();
            expect(linkedTokenIntermediatateBalance).to.equal(expectedLinkedTokenIntermediateBalance);
            const aceIntermediateBalance = (await erc20.balanceOf(ace.address)).toNumber();
            const expectedAceIntermediateBalance = new BN(depositValue).mul(scalingFactor).toNumber();
            expect(aceIntermediateBalance).to.equal(expectedAceIntermediateBalance);

            const burnSender = zkAssetBurnable.address;
            const zeroBurnCounterNote = await note.createZeroValueNote();
            const newBurnCounterValue = 50;
            const newBurnCounterNote = await note.create(secp256k1.generateAccount().publicKey, newBurnCounterValue);
            const burnedNotes = outputNotes;
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            const { receipt: burnReceipt } = await zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData);
            expect(burnReceipt.status).to.equal(true);

            const aceBalanceFinal = (await erc20.balanceOf(ace.address)).toNumber();
            const linkedTokenFinalBalance = (await erc20.balanceOf(accounts[0])).toNumber();

            const expectedAceBalanceFinal = new BN(depositValue).mul(scalingFactor).toNumber();
            expect(aceBalanceFinal).to.equal(expectedAceBalanceFinal);
            const expectedLinkedTokenFinalBalance = tokensTransferred
                .mul(scalingFactor)
                .sub(new BN(depositValue).mul(scalingFactor))
                .toNumber();
            expect(linkedTokenFinalBalance).to.equal(expectedLinkedTokenFinalBalance);
        });
    });

    describe('Failure States', () => {
        let ace;
        let joinSplitFluidValidator;
        let joinSplitValidator;
        let erc20;
        let scalingFactor;

        beforeEach(async () => {
            ace = await ACE.new({ from: accounts[0] });
            erc20 = await ERC20Mintable.new({ from: accounts[0] });
            joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });
            joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: accounts[0] });

            await ace.setCommonReferenceString(bn128.CRS);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);
            await ace.setProof(BURN_PROOF, joinSplitFluidValidator.address);

            erc20 = await ERC20Mintable.new();
            scalingFactor = new BN(1);
        });

        it('should fail if canAdjustSupply flag set to FALSE', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                {
                    from: accounts[0],
                },
            );

            const depositValue = 50;
            const depositSender = accounts[0];
            const noteValues = [30, 20];
            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await constructDepositNotes(noteValues);

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, depositSender, -depositValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, inputNoteOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositValue, { from: accounts[0] });
            await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);

            const burnSender = zkAssetBurnable.address;
            const zeroBurnCounterNote = await note.createZeroValueNote();
            const newBurnCounterValue = 50;
            const newBurnCounterNote = await note.create(secp256k1.generateAccount().publicKey, newBurnCounterValue);
            const burnedNotes = outputNotes;
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            await truffleAssert.reverts(zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData), 'this asset is not burnable');
        });

        it('should fail if confidentialBurn() called from a non-owner', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                {
                    from: accounts[0],
                },
            );

            const depositValue = 50;
            const depositSender = accounts[0];
            const noteValues = [30, 20];
            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await constructDepositNotes(noteValues);

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, depositSender, -depositValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, inputNoteOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositValue, { from: accounts[0] });
            await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);

            const burnSender = zkAssetBurnable.address;
            const zeroBurnCounterNote = await note.createZeroValueNote();
            const newBurnCounterValue = 50;
            const newBurnCounterNote = await note.create(secp256k1.generateAccount().publicKey, newBurnCounterValue);
            const burnedNotes = outputNotes;
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            await truffleAssert.reverts(
                zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData, { from: accounts[1] }),
                'only the owner can call the confidentialBurn() method',
            );
        });

        it('should fail if balancing relationship in burn proof not satisfied', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const zkAssetBurnable = await ZkAssetBurnable.new(
                ace.address,
                erc20.address,
                scalingFactor,
                canAdjustSupply,
                canConvert,
                {
                    from: accounts[0],
                },
            );

            const depositValue = 50;
            const depositSender = accounts[0];
            const noteValues = [30, 20];
            const { inputNotes, inputNoteOwnerAccounts, outputNotes } = await constructDepositNotes(noteValues);

            const publicOwner = accounts[0];
            const tokensTransferred = new BN(1000);
            erc20.mint(accounts[0], scalingFactor.mul(tokensTransferred));
            erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

            const depositProof = new JoinSplitProof(inputNotes, outputNotes, depositSender, -depositValue, publicOwner);
            const depositData = depositProof.encodeABI(zkAssetBurnable.address);
            const depositSignatures = depositProof.constructSignatures(zkAssetBurnable.address, inputNoteOwnerAccounts);
            await ace.publicApprove(zkAssetBurnable.address, depositProof.hash, depositValue, { from: accounts[0] });
            await zkAssetBurnable.confidentialTransfer(depositData, depositSignatures);

            const burnSender = zkAssetBurnable.address;
            const zeroBurnCounterNote = await note.createZeroValueNote();
            const newBurnCounterValue = 50;
            const newBurnCounterNote = await note.create(secp256k1.generateAccount().publicKey, newBurnCounterValue);
            const burnedNotes = outputNotes;

            // Change a value of the burnedNote such that it doesn't satisfy a balancing relationship
            burnedNotes[0] = await note.create(secp256k1.generateAccount().publicKey, 31);
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, burnSender);
            const burnData = burnProof.encodeABI(zkAssetBurnable.address);

            await truffleAssert.reverts(
                zkAssetBurnable.confidentialBurn(BURN_PROOF, burnData, { from: accounts[1] }),
                'only the owner can call the confidentialBurn() method',
            );
        });
    });
});
