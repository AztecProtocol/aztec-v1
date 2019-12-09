/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { JoinSplitProof } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { proofs, constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */
const factoryHelpers = require('../../helpers/Factory');
const { getNotesForAccount } = require('../../helpers/ERC1724');

// ### Artifacts
const ACE = artifacts.require('./ACE');

const Behaviour = artifacts.require('./noteRegistry/interfaces/NoteRegistryBehaviour');
const ERC20Mintable = artifacts.require('./ERC20Mintable');
const JoinSplitValidator = artifacts.require('./JoinSplit');
const TestFactory = artifacts.require('./test/TestFactory');
const Factory201911 = artifacts.require('./noteRegistry/epochs/201911/base/FactoryBase201911');
const Factory201912 = artifacts.require('./noteRegistry/epochs/201912/base/FactoryBase201912');


const { JOIN_SPLIT_PROOF } = proofs;

contract('NoteRegistryManager', (accounts) => {
    const [owner, notOwner, zkAssetOwner] = accounts;
    const scalingFactor = new BN(10);
    const aztecAccount = secp256k1.generateAccount();

    let factoryContract;
    let factory201911;
    let factory201912;
    let ace;
    let erc20;

    beforeEach(async () => {
        ace = await ACE.new();
        await ace.setCommonReferenceString(bn128.CRS);
        ace.setProof(JOIN_SPLIT_PROOF, JoinSplitValidator.address, { from: owner });
        factoryContract = await TestFactory.new(ace.address);

        factory201911 = await Factory201911.new(ace.address);
        factory201912 = await Factory201912.new(ace.address);
        const epoch = 1;
        const cryptoSystem = 1;
        const assetType = 0b01; // (adjust, canConvert) in binary;
        await ace.setFactory(factoryHelpers.generateFactoryId(epoch, cryptoSystem, assetType), factoryContract.address, {
            from: owner,
        });
        erc20 = await ERC20Mintable.new();
        await erc20.mint(zkAssetOwner, 100);
        await erc20.approve(ace.address, 100, { from: zkAssetOwner });
    });

    describe('Success States', async () => {
        it('should register a factory', async () => {
            const receipt = await ace.setFactory(factoryHelpers.generateFactoryId(1, 2, 1), factoryContract.address, {
                from: owner,
            });
            const event = receipt.logs.find((l) => l.event === 'SetFactory');
            expect(event.args.epoch.toNumber()).to.equal(1);
            expect(event.args.cryptoSystem.toNumber()).to.equal(2);
            expect(event.args.assetType.toNumber()).to.equal(1);
            expect(event.args.factoryAddress).to.equal(factoryContract.address);
        });

        it('should increment defaultRegistryEpoch', async () => {
            const epoch = await ace.defaultRegistryEpoch();
            await ace.incrementDefaultRegistryEpoch();
            const newEpoch = await ace.defaultRegistryEpoch();
            expect(newEpoch.toNumber()).to.equal(epoch.toNumber() + 1);
        });

        it('should set defaultCryptoSystem', async () => {
            await ace.setDefaultCryptoSystem(3);
            const newDefaultCryptoSystem = await ace.defaultCryptoSystem();
            expect(newDefaultCryptoSystem.toNumber()).to.equal(3);
        });

        it('should deploy using the most recent factory', async () => {
            const factoryAddress = await ace.getFactoryAddress(factoryHelpers.generateFactoryId(1, 1, 1));
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, {
                from: zkAssetOwner,
            });

            const topic = web3.utils.keccak256('NoteRegistryDeployed(address)');
            const logs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: factoryAddress,
                        topics: [topic],
                    })
                    .then(resolve);
            });

            expect(logs.length).to.not.equal(0);
            const proxyAddress = await ace.registries(zkAssetOwner);
            expect(proxyAddress).to.not.equal(undefined);
            const contract = await Behaviour.at(proxyAddress.behaviour);
            expect(await contract.initialised()).to.equal(true);
        });

        it('should emit correct events on upgrade', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });
            const existingProxy = await ace.registries(zkAssetOwner);
            const newFactoryId = factoryHelpers.generateFactoryId(1, 3, 1);
            const receipt = await ace.setFactory(newFactoryId, factoryContract.address, { from: owner });

            const { factoryAddress } = receipt.logs.find((l) => l.event === 'SetFactory');

            const upgradeReceipt = await ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner });
            const { proxyAddress, newBehaviourAddress } = upgradeReceipt.logs.find((l) => l.event === 'UpgradeNoteRegistry').args;
            expect(newBehaviourAddress).to.not.equal(existingProxy);
            expect(proxyAddress).to.equal(existingProxy.behaviour);

            const topic = web3.utils.keccak256('NoteRegistryDeployed(address)');
            const logs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: factoryAddress,
                        topics: [topic],
                    })
                    .then(resolve);
            });
            expect(logs.length).to.equal(1);

            const upgradeTopic = web3.utils.keccak256('Upgraded(address)');
            const upgradeLogs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: existingProxy.behaviour,
                        topics: [upgradeTopic],
                    })
                    .then(resolve);
            });
            expect(upgradeLogs.length).to.equal(1);
            expect(parseInt(upgradeLogs[0].topics[1], 16)).to.be.equal(parseInt(newBehaviourAddress, 16));
        });

        it('should be able to upgrade from 201911 to 201912', async () => {
            const factoryId201911 = factoryHelpers.generateFactoryId(2, 1, 1);
            const factoryId201912 = factoryHelpers.generateFactoryId(3, 1, 1);

            await ace.setFactory(factoryId201911, factory201911.address, {
                from: owner,
            });
            await ace.setFactory(factoryId201912, factory201912.address, {
                from: owner,
            });

            const canAdjustSupply = false;
            const canConvert = true;

            await ace
                .methods['createNoteRegistry(address,uint256,bool,bool,uint24)']
                (erc20.address, scalingFactor, canAdjustSupply, canConvert, factoryId201911,
                    { from: zkAssetOwner }
                );
            const existingProxy = await ace.registries(zkAssetOwner);

            const upgradeReceipt = await ace.upgradeNoteRegistry(factoryId201912, { from: zkAssetOwner });
            const { proxyAddress, newBehaviourAddress } = upgradeReceipt.logs.find((l) => l.event === 'UpgradeNoteRegistry').args;
            expect(newBehaviourAddress).to.not.equal(existingProxy);
            expect(proxyAddress).to.equal(existingProxy.behaviour);

            const topic = web3.utils.keccak256('NoteRegistryDeployed(address)');
            const logs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: factory201912.address,
                        topics: [topic],
                    })
                    .then(resolve);
            });
            expect(logs.length).to.equal(1);

            const upgradeTopic = web3.utils.keccak256('Upgraded(address)');
            const upgradeLogs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: existingProxy.behaviour,
                        topics: [upgradeTopic],
                    })
                    .then(resolve);
            });
            expect(upgradeLogs.length).to.equal(1);
            expect(parseInt(upgradeLogs[0].topics[1], 16)).to.be.equal(parseInt(newBehaviourAddress, 16));

            const depositValue = -10;
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [10]);
            const depositProof = new JoinSplitProof([], depositOutputNotes, zkAssetOwner, depositValue, zkAssetOwner);
            await ace.publicApprove(zkAssetOwner, depositProof.hash, Math.abs(depositValue), { from: zkAssetOwner });
            const data = depositProof.encodeABI(JoinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, zkAssetOwner, data, { from: zkAssetOwner });
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, zkAssetOwner, { from: zkAssetOwner });
            const firstNote = await ace.getNote(zkAssetOwner, depositProof.outputNotes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        });

        it('should upgrade to a new Note Registry behaviour contract', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });
            const existingProxy = await ace.registries(zkAssetOwner);
            const newFactoryId = factoryHelpers.generateFactoryId(1, 3, 1);
            const newFactoryContract = await TestFactory.new(ace.address);

            await ace.setFactory(newFactoryId, newFactoryContract.address, { from: owner });

            const preUpgradeBehaviour = await factoryContract.getImplementation.call(existingProxy.behaviour);

            await ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner });

            const postUpgradeProxy = await ace.registries(zkAssetOwner);
            expect(postUpgradeProxy.behaviour).to.equal(existingProxy.behaviour);

            const newBehaviourAddress = await newFactoryContract.getImplementation.call(existingProxy.behaviour);
            expect(newBehaviourAddress).to.not.equal(preUpgradeBehaviour);
        });

        it('should keep state after upgrade', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });

            const depositValue = -10;
            const depositOutputNotes = await getNotesForAccount(aztecAccount, [10]);
            const depositProof = new JoinSplitProof([], depositOutputNotes, zkAssetOwner, depositValue, zkAssetOwner);
            await ace.publicApprove(zkAssetOwner, depositProof.hash, Math.abs(depositValue), { from: zkAssetOwner });
            const data = depositProof.encodeABI(JoinSplitValidator.address);
            await ace.validateProof(JOIN_SPLIT_PROOF, zkAssetOwner, data, { from: zkAssetOwner });
            await ace.updateNoteRegistry(JOIN_SPLIT_PROOF, depositProof.eth.output, zkAssetOwner, { from: zkAssetOwner });

            const newFactoryId = factoryHelpers.generateFactoryId(1, 3, 1);
            await ace.setFactory(newFactoryId, factoryContract.address, { from: owner });

            await ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner });
            const firstNote = await ace.getNote(zkAssetOwner, depositProof.outputNotes[0].noteHash);
            expect(firstNote.status.toNumber()).to.equal(constants.statuses.NOTE_UNSPENT);
        });
    });

    describe('Failure States', async () => {
        it('should not register a factory if sent by non-owner', async () => {
            await truffleAssert.reverts(
                ace.setFactory(factoryHelpers.generateFactoryId(1, 1, 1), factoryContract.address, { from: notOwner }),
            );
        });

        it('should not deploy if no factory exists', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const factoryId = factoryHelpers.generateFactoryId(1, 3, 1);
            await truffleAssert.reverts(
                ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, factoryId),
                'expected the factory address to exist',
            );
        });

        it('should not deploy if mismatch between asset flags and factory id', async () => {
            const epoch = 1;
            const cryptoSystem = 1;
            const assetType = 0b00; // (canAdjust, canConvert) in binary;
            const factoryId = factoryHelpers.generateFactoryId(epoch, cryptoSystem, assetType);
            await ace.setFactory(factoryId, factoryContract.address, { from: owner });

            const canAdjustSupply = true;
            const canConvert = true;
            await truffleAssert.reverts(
                ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, factoryId),
                'expected note registry to match flags',
            );
        });

        it("should not upgrade if factory assetType different from existing registry's type", async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const epoch = 1;
            const cryptoSystem = 1;
            const assetType = 0b00; // (canAdjust, canConvert) in binary;
            const newFactoryId = factoryHelpers.generateFactoryId(epoch, cryptoSystem, assetType);

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });

            await truffleAssert.reverts(
                ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner }),
                'expected assetType to be the same for old and new registry',
            );
        });

        it('should not upgrade if epoch of new factory is smaller than epoch of current registry', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const epoch = 0;
            const cryptoSystem = 1;
            const assetType = 0b01; // (canAdjust, canConvert) in binary;
            const newFactoryId = factoryHelpers.generateFactoryId(epoch, cryptoSystem, assetType);

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });

            await truffleAssert.reverts(
                ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner }),
                'expected new registry to be of epoch equal or greater than existing registry',
            );
        });
    });
});
