/* global artifacts, expect, contract, beforeEach, web3, it:true */

const truffleAssert = require('truffle-assertions');
const { keccak256, randomHex } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour20200106 = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');

const TestBehaviour = artifacts.require('./test/AccountRegistry/TestBehaviour');
const TestBehaviourEpoch = artifacts.require('./test/AccountRegistry/TestBehaviourEpoch');
const createSignature = require('../helpers/AccountRegistryManager');

contract('Account registry manager', async (accounts) => {
    const owner = accounts[0];
    const opts = { from: owner };

    const aceAddress = randomHex(20);
    const trustedGSNSignerAddress = randomHex(20);

    describe('Success states', async () => {
        describe('Initialisation', async () => {
            let behaviour;
            let initialBehaviourAddress;

            beforeEach(async () => {
                behaviour = await Behaviour20200106.new();
                initialBehaviourAddress = behaviour.address;
            });

            it('should set manager contract owner', async () => {
                const manager = await AccountRegistryManager.new(
                    initialBehaviourAddress,
                    aceAddress,
                    trustedGSNSignerAddress,
                    opts,
                );
                const managerOwner = await manager.owner();
                expect(managerOwner).to.equal(owner);
            });

            it('should set proxyAddress and proxyAdmin on deployed proxy', async () => {
                const manager = await AccountRegistryManager.new(
                    initialBehaviourAddress,
                    aceAddress,
                    trustedGSNSignerAddress,
                    opts,
                );
                const topic = keccak256('CreateProxy(address,address)');
                const logs = await web3.eth.getPastLogs({ address: manager.address, topics: [topic] });

                const deployedProxyAddress = await manager.proxyAddress.call();
                const proxyAdmin = manager.address;
                expect(logs.length).to.equal(1);
                expect(parseInt(logs[0].topics[1], 16)).to.equal(parseInt(deployedProxyAddress, 16));
                expect(parseInt(logs[0].topics[2], 16)).to.equal(parseInt(proxyAdmin, 16));
            });

            it('should initialise epoch number on proxy', async () => {
                const manager = await AccountRegistryManager.new(
                    initialBehaviourAddress,
                    aceAddress,
                    trustedGSNSignerAddress,
                    opts,
                );
                const postDeployEpoch = await manager.latestEpoch();
                expect(postDeployEpoch.toString()).to.equal('1');
            });
        });

        describe('Upgrade pattern', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour20200106.new();

                const initialBehaviourAddress = behaviour.address;
                manager = await AccountRegistryManager.new(initialBehaviourAddress, aceAddress, trustedGSNSignerAddress, opts);
            });

            it('should successfully register account mapping', async () => {
                // register an account with the extension, which will be put in storage under accountMapping
                const proxyAddress = await manager.proxyAddress.call();
                const { address, linkedPublicKey, spendingPublicKey, sig } = createSignature(proxyAddress);

                const proxyContract = await Behaviour20200106.at(proxyAddress);
                await proxyContract.registerAZTECExtension(address, linkedPublicKey, spendingPublicKey, sig);
                const storedLinkedPublicKey = await proxyContract.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey);
            });

            it('should upgrade to a new Account Registry behaviour contract', async () => {
                const testBehaviour = await TestBehaviour.new();
                const existingProxy = await manager.proxyAddress.call();

                await manager.upgradeAccountRegistry(testBehaviour.address);

                const postUpgradeProxy = await manager.proxyAddress.call();
                expect(postUpgradeProxy).to.equal(existingProxy);

                const newBehaviourAddress = await manager.getImplementation.call();
                const expectedNewBehaviourAddress = testBehaviour.address;
                expect(newBehaviourAddress).to.equal(expectedNewBehaviourAddress);

                const proxyContract = await TestBehaviour.at(existingProxy);
                const isNewFeatureImplemented = await proxyContract.newFeature();
                expect(isNewFeatureImplemented).to.equal(true);
            });

            it('should keep state after upgrade', async () => {
                // register an account with the extension, which will be put in storage under accountMapping
                const proxyAddress = await manager.proxyAddress.call();
                const { address, linkedPublicKey, spendingPublicKey, sig } = createSignature(proxyAddress);

                let proxyContract = await Behaviour20200106.at(proxyAddress);
                await proxyContract.registerAZTECExtension(address, linkedPublicKey, spendingPublicKey, sig);

                // perform upgrade, and confirm that registered linkedPublicKey is still present in storage
                const testBehaviour = await TestBehaviour.new();
                await manager.upgradeAccountRegistry(testBehaviour.address);

                proxyContract = await TestBehaviour.at(proxyAddress);
                const storedLinkedPublicKey = await proxyContract.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey);
            });

            it('should update latestEpoch number during upgrade', async () => {
                const preUpgradeEpoch = await manager.latestEpoch();
                expect(preUpgradeEpoch.toString()).to.equal('1');

                const testBehaviour = await TestBehaviour.new();
                await manager.upgradeAccountRegistry(testBehaviour.address);

                const postUpgradeEpoch = await manager.latestEpoch();
                expect(postUpgradeEpoch.toString()).to.equal('2');
            });
        });
    });

    describe('Failure states', async () => {
        const fakeOwner = accounts[1];

        describe('Upgrade flows', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour20200106.new();
                const initialBehaviourAddress = behaviour.address;

                manager = await AccountRegistryManager.new(initialBehaviourAddress, aceAddress, trustedGSNSignerAddress, opts);
            });

            it('should not perform upgrade if not owner', async () => {
                const testBehaviour = await TestBehaviour.new();

                await truffleAssert.reverts(
                    manager.upgradeAccountRegistry(testBehaviour.address, { from: fakeOwner }),
                    'Ownable: caller is not the owner',
                );
            });

            it('should not upgrade to a behaviour with a lower epoch than manager latest epoch', async () => {
                const testBehaviourEpoch = await TestBehaviourEpoch.new();
                await truffleAssert.reverts(
                    manager.upgradeAccountRegistry(testBehaviourEpoch.address),
                    'expected new registry to be of epoch greater than existing registry',
                );
            });
        });
    });
});
