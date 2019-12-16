/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
const { JoinSplitProof, MintProof, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');

const ACE = artifacts.require('./ACE');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitFluidValidator = artifacts.require('./JoinSplitFluid');
const BaseFactory = artifacts.require('./noteRegistry/epochs/201912/base/FactoryBase201912');
const AdjustableFactory = artifacts.require('./noteRegistry/epochs/201912/adjustable/FactoryAdjustable201912');
const BehaviourContract201912 = artifacts.require('./noteRegistry/epochs/201912/Behaviour201912');

const { generateFactoryId } = require('../../../../helpers/Factory');
const { getNotesForAccount } = require('../../../../helpers/ERC1724');

let ace;
const aztecAccount = secp256k1.generateAccount();
const { BOGUS_PROOF, JOIN_SPLIT_PROOF, MINT_PROOF } = proofs;
const canAdjustSupply = false;
const canConvert = true;
let erc20;
const scalingFactor = new BN(10);
const tokensTransferred = new BN(100000);

contract('NoteRegistry', (accounts) => {
    const [aceOwner, owner] = accounts;

    let depositProof;
    let mintProof;
    const depositNoteValues = [20, 20];
    const depositPublicValue = -40;

    beforeEach(async () => {
        ace = await ACE.new({ from: aceOwner });
        await ace.setCommonReferenceString(bn128.CRS);
        ace.setProof(JOIN_SPLIT_PROOF, JoinSplitValidator.address, { from: aceOwner });
        ace.setProof(MINT_PROOF, JoinSplitFluidValidator.address, { from: aceOwner });

        const baseFactory = await BaseFactory.new(ace.address);
        const adjustableFactory = await AdjustableFactory.new(ace.address);

        await ace.setFactory(generateFactoryId(1, 1, 1), baseFactory.address);
        await ace.setFactory(generateFactoryId(1, 1, 2), adjustableFactory.address);
        await ace.setFactory(generateFactoryId(1, 1, 3), adjustableFactory.address);

        erc20 = await ERC20Mintable.new();
        await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await erc20.mint(owner, scalingFactor.mul(tokensTransferred));
        await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), { from: owner });

        const depositOutputNotes = await getNotesForAccount(aztecAccount, depositNoteValues);
        depositProof = new JoinSplitProof([], depositOutputNotes, owner, depositPublicValue, owner);
        const zeroMintCounterNote = await note.createZeroValueNote();
        const newMintCounterNote = await note.create(aztecAccount.publicKey, depositPublicValue * -1);
        mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, depositOutputNotes, owner);
    });

    describe('Success States', async () => {
        it('should allow creating assets using 201911', async () => {
            const opts = { from: owner };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            expect(receipt.status).to.equal(true);
        });

        it('should allow depositing to 201911 asset independent of flag', async () => {
            const opts = { from: owner };
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);

            const data = depositProof.encodeABI(JoinSplitValidator.address);
            await ace.publicApprove(owner, depositProof.hash, Math.abs(depositPublicValue), opts);
            await ace.validateProof(JOIN_SPLIT_PROOF, owner, data, opts);
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, owner, opts);
            const result = await ace.getNote(owner, depositProof.outputNotes[0].noteHash);
            const block = await web3.eth.getBlock('latest');
            expect(result.status.toNumber()).to.equal(1);
            expect(result.createdOn.toString()).to.equal(block.timestamp.toString());
            expect(result.destroyedOn.toString()).to.equal('0');
            expect(result.noteOwner).to.equal(depositProof.outputNotes[0].owner);
        });

        it('should not change flag state', async () => {
            const opts = { from: owner };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            const log = receipt.logs.find((l) => l.event === 'CreateNoteRegistry');
            const { registryAddress } = log.args;
            const registry = await BehaviourContract201912.at(registryAddress);
            const flagPreTrigger = await registry.isAvailableDuringSlowRelease();
            expect(flagPreTrigger).to.equal(false);
            await ace.makeAssetAvailable(owner, { from: aceOwner });
            const flagPostTrigger = await registry.isAvailableDuringSlowRelease();
            expect(flagPostTrigger).to.equal(false);
        });

        it('should allow minting independent of flag', async () => {
            const opts = { from: owner };
            const canAdjust = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjust, canConvert, opts);
            await ace.mint(MINT_PROOF, mintProof.encodeABI(), owner, { from: owner });
        });
    });
});
