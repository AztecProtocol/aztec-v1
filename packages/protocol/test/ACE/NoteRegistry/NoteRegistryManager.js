/* eslint-disable prefer-destructuring */
/* global artifacts, expect, contract, beforeEach, it, web3:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');

// ### Internal Dependencies
/* eslint-disable-next-line object-curly-newline */

// ### Artifacts
const ACE = artifacts.require('./ACE');
const NoteRegistryFactory = artifacts.require('./noteRegistry/epochs/201907/convertible/FactoryConvertible201907');
const Behaviour = artifacts.require('./noteRegistry/interfaces/NoteRegistryBehaviour');
const ERC20Mintable = artifacts.require('./ERC20Mintable');

const generateFactoryId = (epoch, cryptoSystem, assetType) => {
    return epoch * 256 ** 2 + cryptoSystem * 256 ** 1 + assetType * 256 ** 0;
};

contract('NoteRegistryManager', (accounts) => {
    const [owner, notOwner, zkAssetOwner] = accounts;
    const scalingFactor = new BN(10);

    let factoryContract;
    let ace;
    let erc20;

    beforeEach(async () => {
        ace = await ACE.new();
        factoryContract = await NoteRegistryFactory.new(ace.address);
        const epoch = 1;
        const cryptoSystem = 1;
        const assetType = 0b01; // (adjust, canConvert) in binary;
        await ace.setFactory(generateFactoryId(epoch, cryptoSystem, assetType), factoryContract.address, { from: owner });
        erc20 = await ERC20Mintable.new();
    });

    describe('Success States', async () => {
        it('should register a factory', async () => {
            const receipt = await ace.setFactory(generateFactoryId(1, 2, 1), factoryContract.address, { from: owner });
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
            const factoryAddress = await ace.getFactoryAddress(generateFactoryId(1, 1, 1));
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
            const behaviourAddress = await ace.registries(zkAssetOwner);
            expect(behaviourAddress).to.not.equal(undefined);
            const contract = await Behaviour.at(behaviourAddress);
            expect(await contract.initialised()).to.equal(true);
        });

        it('should upgrade to a new Note Registry behaviour contract', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });
            const behaviourAddress = await ace.registries(zkAssetOwner);
            const newFactoryId = generateFactoryId(1, 3, 1);
            const receipt = await ace.setFactory(newFactoryId, factoryContract.address, { from: owner });

            const { factoryAddress } = receipt.logs.find((l) => l.event === 'SetFactory');

            await ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner });
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
            const newBehaviourAddress = await ace.registries(zkAssetOwner);
            expect(newBehaviourAddress).to.not.equal(behaviourAddress);

            const upgradeTopic = web3.utils.keccak256('Upgraded(address)');
            const upgradeLogs = await new Promise((resolve) => {
                web3.eth
                    .getPastLogs({
                        address: behaviourAddress, // Actually the address of the proxy
                        topics: [upgradeTopic],
                    })
                    .then(resolve);
            });
            expect(upgradeLogs.length).to.equal(1);
            expect(parseInt(upgradeLogs[0].topics[1], 16)).to.be.equal(parseInt(newBehaviourAddress, 16));
        });
    });

    describe('Failure States', async () => {
        it('should not register a factory if sent by non-owner', async () => {
            await truffleAssert.reverts(ace.setFactory(generateFactoryId(1, 1, 1), factoryContract.address, { from: notOwner }));
        });

        it('should not deploy if no factory exists', async () => {
            const canAdjustSupply = false;
            const canConvert = true;
            const factoryId = generateFactoryId(1, 3, 1);
            await truffleAssert.reverts(
                ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, factoryId),
                'expected the factory address to exist',
            );
        });

        it('should not deploy if mismatch between asset flags and factory id', async () => {
            const epoch = 1;
            const cryptoSystem = 1;
            const assetType = 0b00; // (canAdjust, canConvert) in binary;
            const factoryId = generateFactoryId(epoch, cryptoSystem, assetType);
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
            const newFactoryId = generateFactoryId(epoch, cryptoSystem, assetType);

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
            const newFactoryId = generateFactoryId(epoch, cryptoSystem, assetType);

            await ace.createNoteRegistry(erc20.address, scalingFactor, canAdjustSupply, canConvert, { from: zkAssetOwner });

            await truffleAssert.reverts(
                ace.upgradeNoteRegistry(newFactoryId, { from: zkAssetOwner }),
                'expected new registry to be of epoch equal or greater than existing registry',
            );
        });
    });
});
