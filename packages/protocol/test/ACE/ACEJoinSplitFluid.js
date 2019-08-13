/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const { BurnProof, JoinSplitProof, MintProof, note } = require('aztec.js');
const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { BURN_PROOF, JOIN_SPLIT_PROOF, MINT_PROOF } = proofs;

// ### Artifacts
const ACE = artifacts.require('./ACE');
const Dividend = artifacts.require('./Dividend');
const DividendInterface = artifacts.require('./DividendInterface');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplit = artifacts.require('./JoinSplit');
const JoinSplitInterface = artifacts.require('./JoinSplitInterface');
const JoinSplitFluid = artifacts.require('./JoinSplitFluid');
const JoinSplitFluidInterface = artifacts.require('./JoinSplitFluidInterface');
const Swap = artifacts.require('./Swap');
const SwapInterface = artifacts.require('./SwapInterface');
const AdjustableFactory = artifacts.require('./noteRegistry/epochs/201907/adjustable/FactoryAdjustable201907');
const ConvertibleFactory = artifacts.require('./noteRegistry/epochs/201907/convertible/FactoryConvertible201907');
const MixedFactory = artifacts.require('./noteRegistry/epochs/201907/mixed/FactoryMixed201907');

const { generateFactoryId } = require('../helpers/Factory');

Dividend.abi = DividendInterface.abi;
JoinSplit.abi = JoinSplitInterface.abi;
JoinSplitFluid.abi = JoinSplitFluidInterface.abi;
Swap.abi = SwapInterface.abi;

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

const getDefaultBurnNotes = async () => {
    const newBurnCounter = 50;
    const burnedNoteValues = [20, 30];

    const zeroBurnCounterNote = await note.createZeroValueNote();
    const newBurnCounterNote = await note.create(publicKey, newBurnCounter);
    const burnedNotes = await Promise.all(burnedNoteValues.map((burnedValue) => note.create(publicKey, burnedValue)));
    return { zeroBurnCounterNote, newBurnCounterNote, burnedNotes };
};

contract('ACE Mint and Burn Functionality', (accounts) => {
    describe('Success States', () => {
        let ace;
        let joinSplitFluidValidator;
        let joinSplitValidator;
        let erc20;
        const sender = accounts[0];

        beforeEach(async () => {
            ace = await ACE.new({ from: sender });

            joinSplitFluidValidator = await JoinSplitFluid.new();
            joinSplitValidator = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, joinSplitFluidValidator.address);
            await ace.setProof(BURN_PROOF, joinSplitFluidValidator.address);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);

            const convertibleFactory = await ConvertibleFactory.new(ace.address);
            const mixedFactory = await MixedFactory.new(ace.address);

            await ace.setFactory(generateFactoryId(1, 1, 1), convertibleFactory.address, { from: sender });
            await ace.setFactory(generateFactoryId(1, 1, 3), mixedFactory.address, { from: sender });

            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });
        });

        it('should validate mint proof', async () => {
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const { receipt: mintRecceipt } = await ace.validateProof(MINT_PROOF, sender, data);
            expect(mintRecceipt.status).to.equal(true);
        });

        it('should validate burn proof', async () => {
            const { zeroBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const { receipt: burnReceipt } = await ace.validateProof(BURN_PROOF, sender, data);
            expect(burnReceipt.status).to.equal(true);
        });

        it('should burn notes that have been minted', async () => {
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const mintData = mintProof.encodeABI();
            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, mintData, sender);
            expect(mintReceipt.status).to.equal(true);

            // burn the minted notes
            const burnedNotes = mintedNotes;

            const { zeroBurnCounterNote, newBurnCounterNote } = await getDefaultBurnNotes();
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const burnData = burnProof.encodeABI();
            const { receipt: burnReceipt } = await ace.burn(BURN_PROOF, burnData, sender);
            expect(burnReceipt.status).to.equal(true);
        });
    });

    describe('Failure States', () => {
        let ace;
        let joinSplitFluidValidator;
        let joinSplitValidator;
        const sender = accounts[0];

        beforeEach(async () => {
            ace = await ACE.new({ from: sender });

            joinSplitFluidValidator = await JoinSplitFluid.new();
            joinSplitValidator = await JoinSplit.new();

            await ace.setCommonReferenceString(constants.CRS);
            await ace.setProof(MINT_PROOF, joinSplitFluidValidator.address);
            await ace.setProof(BURN_PROOF, joinSplitFluidValidator.address);
            await ace.setProof(JOIN_SPLIT_PROOF, joinSplitValidator.address);

            const adjustableFactory = await AdjustableFactory.new(ace.address);
            const convertibleFactory = await ConvertibleFactory.new(ace.address);
            const mixedFactory = await MixedFactory.new(ace.address);

            await ace.setFactory(generateFactoryId(1, 1, 1), convertibleFactory.address, { from: sender });
            await ace.setFactory(generateFactoryId(1, 1, 2), adjustableFactory.address);
            await ace.setFactory(generateFactoryId(1, 1, 3), mixedFactory.address, { from: sender });
        });

        it('should fail if asset is not mintable', async () => {
            const scalingFactor = new BN(1);
            const canAdjustSupply = false;
            const canConvert = true;

            const erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const mintData = mintProof.encodeABI();
            await truffleAssert.reverts(ace.mint(MINT_PROOF, mintData, sender), 'this asset is not mintable');
        });

        it('should fail when converting value and asset is NOT convertible', async () => {
            const erc20 = await ERC20Mintable.new();
            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = false;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const mintData = mintProof.encodeABI();
            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, mintData, sender);
            expect(mintReceipt.status).to.equal(true);

            const withdrawPublicValue = 50;
            const withdrawPublicOwner = accounts[0];

            const withdrawProof = new JoinSplitProof(mintedNotes, [], sender, withdrawPublicValue, withdrawPublicOwner);
            const withdrawData = withdrawProof.encodeABI(joinSplitValidator.address);
            const { receipt: withdrawReceipt } = await ace.validateProof(JOIN_SPLIT_PROOF, sender, withdrawData);
            expect(withdrawReceipt.status).to.equal(true);

            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, withdrawProof.eth.output, sender),
                'asset cannot be converted into public tokens',
            );
        });

        it('should fail to update the validatedProofs mapping for mint proofs', async () => {
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const mintData = mintProof.encodeABI();

            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            const erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.validateProof(MINT_PROOF, sender, mintData);
            expect(mintReceipt.status).to.equal(true);

            await truffleAssert.reverts(
                ace.updateNoteRegistry(MINT_PROOF, mintProof.eth.output, sender),
                'ACE has not validated a matching proof',
            );
        });

        it('should fail to update the validatedProofs mapping for burn proofs', async () => {
            const { zeroMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const mintData = mintProof.encodeABI();

            const scalingFactor = new BN(1);
            const canAdjustSupply = true;
            const canConvert = true;

            const erc20 = await ERC20Mintable.new();
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: accounts[0],
            });

            const { receipt: mintReceipt } = await ace.mint(MINT_PROOF, mintData, sender);
            expect(mintReceipt.status).to.equal(true);

            // burn the minted notes
            const burnedNotes = mintedNotes;

            const { zeroBurnCounterNote, newBurnCounterNote } = await getDefaultBurnNotes();
            const burnProof = new BurnProof(zeroBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const burnData = burnProof.encodeABI();
            const { receipt: burnReceipt } = await ace.validateProof(BURN_PROOF, sender, burnData);
            expect(burnReceipt.status).to.equal(true);

            await truffleAssert.reverts(
                ace.updateNoteRegistry(BURN_PROOF, burnData, sender),
                'ACE has not validated a matching proof',
            );
        });

        it('should fail if two note registries are linked to the same ERC20 token', async () => {
            const scalingFactor = new BN(10);
            const tokensTransferred = new BN(50);

            // User A creates a note registry linked to a particular ERC20 token, and
            // transfers 50 tokens to it
            const [ownerA, attacker] = accounts;
            const [recipient1, recipient2] = [...new Array(2)].map(() => secp256k1.generateAccount());

            const erc20 = await ERC20Mintable.new();
            await erc20.mint(ownerA, scalingFactor.mul(tokensTransferred), { from: ownerA, gas: 4700000 });

            // Set the first note registry
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: ownerA,
                gas: 4700000,
            });

            await erc20.approve(
                ace.address, // address approving to spend
                scalingFactor.mul(tokensTransferred), // value to transfer
                { from: ownerA, gas: 4700000 },
            );

            const outputNotes = [await note.create(recipient1.publicKey, 50)];

            const depositPublicValue = -50;
            const depositPublicOwner = ownerA;
            const depositProof = new JoinSplitProof([], outputNotes, ownerA, depositPublicValue, depositPublicOwner);
            const depositData = depositProof.encodeABI(joinSplitValidator.address);

            await ace.publicApprove(ownerA, depositProof.hash, 50, { from: ownerA });
            await ace.validateProof(JOIN_SPLIT_PROOF, ownerA, depositData, { from: ownerA });
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, ownerA, { from: ownerA });

            // Attacker creates a note registry, linked to same public ERC20 contract
            const canAdjustSupplyAttacker = true;
            const canConvertAttacker = true;

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupplyAttacker, canConvertAttacker, {
                from: attacker,
            });

            const newMintCounterNote = await note.create(recipient2.publicKey, 1);
            const zeroMintCounterNote = await note.createZeroValueNote();
            const mintedNotes = [await note.create(recipient2.publicKey, 1)];
            const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, mintedNotes, attacker);
            const mintData = mintProof.encodeABI();
            await ace.mint(MINT_PROOF, mintData, attacker, { from: attacker });

            // User B attempts to convert their minted note into tokens via updateNoteRegisty()
            const withdrawPublicValue = 1;
            const withdrawPublicOwner = attacker;
            const attackerWithdrawProof = new JoinSplitProof(mintedNotes, [], attacker, withdrawPublicValue, withdrawPublicOwner);
            const attackerWithdrawData = attackerWithdrawProof.encodeABI(joinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, attacker, attackerWithdrawData, { from: attacker });
            await ace.publicApprove(attacker, attackerWithdrawProof.hash, withdrawPublicValue, { from: attacker });

            await truffleAssert.reverts(
                ace.updateNoteRegistry(JOIN_SPLIT_PROOF, attackerWithdrawProof.eth.output, attacker, { from: attacker }),
            );
        });
    });
});
