/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
const { JoinSplitProof } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { constants, proofs } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

const ACE = artifacts.require('./ACE');
const ERC20BrokenTransferTest = artifacts.require('./ERC20BrokenTransferTest');
const ERC20BrokenTransferFromTest = artifacts.require('./ERC20BrokenTransferFromTest');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const BaseFactory = artifacts.require('./noteRegistry/epochs/201911/base/FactoryBase201911');
const AdjustableFactory = artifacts.require('./noteRegistry/epochs/201911/adjustable/FactoryAdjustable201911');
const BehaviourContract = artifacts.require('./noteRegistry/interfaces/NoteRegistryBehaviour');
const BehaviourContract201911 = artifacts.require('./noteRegistry/epochs/201911/Behaviour201911');


const { generateFactoryId } = require('../../../../helpers/Factory');
const { getNotesForAccount } = require('../../../../helpers/ERC1724');

let ace;
const aztecAccount = secp256k1.generateAccount();
const { BOGUS_PROOF, JOIN_SPLIT_PROOF } = proofs;
const canAdjustSupply = false;
const canConvert = true;
let erc20;
const scalingFactor = new BN(10);
const tokensTransferred = new BN(100000);

contract.only('NoteRegistry', (accounts) => {
    const [aceOwner ,owner, nonOwner] = accounts;

    let confidentialProof;
    let depositProof;
    const depositNoteValues = [20, 20];
    const depositPublicValue = -40;
    const publicOwner = accounts[0];
    let withdrawProof;
    const withdrawNoteValues = [10, 30];
    const withdrawPublicValue = 40;

    beforeEach(async () => {
        ace = await ACE.new({ from: aceOwner });
        await ace.setCommonReferenceString(bn128.CRS);
        ace.setProof(JOIN_SPLIT_PROOF, JoinSplitValidator.address, { from: aceOwner });

        const baseFactory = await BaseFactory.new(ace.address);
        const adjustableFactory = await AdjustableFactory.new(ace.address);

        await ace.setFactory(generateFactoryId(1, 1, 1), baseFactory.address);
        await ace.setFactory(generateFactoryId(1, 1, 2), adjustableFactory.address);
        await ace.setFactory(generateFactoryId(1, 1, 3), adjustableFactory.address);

        erc20 = await ERC20Mintable.new();
        await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert);
        await erc20.mint(aceOwner, scalingFactor.mul(tokensTransferred));
        await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred));

        const depositOutputNotes = await getNotesForAccount(aztecAccount, depositNoteValues);
        depositProof = new JoinSplitProof([], depositOutputNotes, aceOwner, depositPublicValue, publicOwner);
        const confidentialOutputNotes = await getNotesForAccount(aztecAccount, withdrawNoteValues);
        confidentialProof = new JoinSplitProof(depositOutputNotes, confidentialOutputNotes, aceOwner, 0, publicOwner);
        withdrawProof = new JoinSplitProof(depositOutputNotes, [], aceOwner, withdrawPublicValue, publicOwner);
    });

    describe('Success States', async () => {
        it('should be able to create assets using 201911', async () => {
            const opts = { from: owner };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            expect(receipt.status).to.equal(true);
        });

        it('should be able to deposit to 201911 asset after flag has been set', async () => {

        });

        it('should be able to deposit to 201911 asset after timestamp even if flag is not set', async () => {

        });

        it.only('should be able to set flag if owner', async () => {
            const opts = { from: owner };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            const log = receipt.logs.find(l => l.event === 'CreateNoteRegistry');
            const { registryAddress } = log.args;
            const registry = await BehaviourContract201911.at(registryAddress);
            const flagPreTrigger = await registry.isAvailableDuringSlowRelease();
            expect(flagPreTrigger).to.equal(false);
            await ace.makeAssetAvailable(owner, { from: aceOwner });
            const flagPostTrigger = await registry.isAvailableDuringSlowRelease();
            expect(flagPostTrigger).to.equal(true);
        });
    });

    describe('Failure States', async () => {
        it('should not allow deposit if flag is not set and before timestamp', async () => {

        });

        it.only('should not be able to set flag if not owner', async () => {
            const opts = { from: owner };
            const { receipt } = await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, opts);
            const log = receipt.logs.find(l => l.event === 'CreateNoteRegistry');
            const { registryAddress } = log.args;
            const registry = await BehaviourContract201911.at(registryAddress);
            await truffleAssert.reverts(registry.makeAvailable(opts));
        });
    });
});
