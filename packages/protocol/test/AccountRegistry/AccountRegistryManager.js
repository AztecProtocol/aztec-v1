/* global artifacts, expect, contract, beforeEach, web3, it:true */

const truffleAssert = require('truffle-assertions');
const { keccak256, randomHex } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour20200106 = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const Behaviour20200207 = artifacts.require('./Behaviour20200207/epochs/20200207/Behaviour20200207');
const TestBehaviour = artifacts.require('./test/AccountRegistry/epochs/20200106/TestBehaviour');
const TestBehaviourEpoch = artifacts.require('./test/AccountRegistry/epochs/20200106/TestBehaviourEpoch');
const TestFnOverload = artifacts.require('./test/AccountRegistry/epochs/20200106/TestFnOverload');

const createSignature = require('../helpers/AccountRegistry/AccountRegistryManager');

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

            it('should set epoch number on manager', async () => {
                const manager = await AccountRegistryManager.new(
                    initialBehaviourAddress,
                    aceAddress,
                    trustedGSNSignerAddress,
                    opts,
                );
                const postDeployEpoch = await manager.latestEpoch();
                expect(postDeployEpoch.toString()).to.equal('1');
            });

            it('should initialise TransactionRelayer and GSN related contracts', async () => {
                /**
                 * 3 contracts are initialised when the behaviour contract is initialised:
                 * 1) TransactionRelayer
                 * 2) GSNRecipientSignature
                 * 3) GSNRecipientTimestampSignature
                 *
                 * The TransactionRelayer initialisation can not be easily detected - the initialised variable is
                 * internal and no event is emitted.
                 *
                 * The GSNRecipientSignature initialisation can be detected - it inherits from GSNRecipient,
                 * which emits a RelayHubChanged(address,address) event.
                 *
                 * The GSNRecipientTimestampSignature initialisation can not be easily detected - the initialised
                 * variable is internal and the same RelayHubChanged(address,address) event is emitted as in
                 * GSNRecipientSignature
                 */

                const manager = await AccountRegistryManager.new(
                    initialBehaviourAddress,
                    aceAddress,
                    trustedGSNSignerAddress,
                    opts,
                );

                const proxyAddress = await manager.proxyAddress.call();
                const relayHubTopic = keccak256('RelayHubChanged(address,address)');
                const relayHubLogs = await web3.eth.getPastLogs({ address: proxyAddress.address, topics: [relayHubTopic] });

                const oldRelayHub = '0x0000000000000000000000000000000000000000000000000000000000000000';
                const newRelayHub = '0xD216153c06E857cD7f72665E0aF1d7D82172F494'; // hard-coded into the open-zeppelin contracts
                expect(parseInt(relayHubLogs[0].topics[1], 16)).to.equal(parseInt(oldRelayHub, 16));
                expect(parseInt(relayHubLogs[0].topics[2], 16)).to.equal(parseInt(newRelayHub, 16));
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
                const { address, AZTECaddress, linkedPublicKey, spendingPublicKey, sig } = createSignature(proxyAddress);

                const proxyContract = await Behaviour20200106.at(proxyAddress);

                await proxyContract.registerAZTECExtension(address, AZTECaddress, linkedPublicKey, spendingPublicKey, sig);
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
                expect(isNewFeatureImplemented).to.equal('new feature');
            });

            it('should set a state variable on an upgraded behaviour contract', async () => {
                const behaviour20200207 = await Behaviour20200207.new();

                await manager.upgradeAccountRegistry(behaviour20200207.address);
                const proxyAddress = await manager.proxyAddress();
                const proxyContract = await Behaviour20200207.at(proxyAddress);

                await proxyContract.setGSNSigner();
                const recoveredGSNSigner = await proxyContract.GSNSigner();
                const expectedGSNSigner = '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8';
                expect(recoveredGSNSigner).to.equal(expectedGSNSigner);
            });

            it('should overload a function on an upgraded behaviour contract', async () => {
                const testFnOverload = await TestFnOverload.new();

                await manager.upgradeAccountRegistry(testFnOverload.address);
                const proxyAddress = await manager.proxyAddress();
                const proxyContract = await TestFnOverload.at(proxyAddress);

                const result = await proxyContract.newFeature();
                expect(result).to.equal('function overload');
            });

            it('should keep state after upgrade', async () => {
                // register an account with the extension, which will be put in storage under accountMapping
                const proxyAddress = await manager.proxyAddress.call();
                const { address, AZTECaddress, linkedPublicKey, spendingPublicKey, sig } = createSignature(proxyAddress);

                const proxyContract = await Behaviour20200106.at(proxyAddress);

                await proxyContract.registerAZTECExtension(address, AZTECaddress, linkedPublicKey, spendingPublicKey, sig);

                // perform upgrade, and confirm that registered linkedPublicKey is still present in storage
                const testBehaviour = await TestBehaviour.new();
                await manager.upgradeAccountRegistry(testBehaviour.address);

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
