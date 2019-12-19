/* global artifacts, expect, contract, beforeEach, it:true */
const { signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const truffleAssert = require('truffle-assertions');
const { keccak256, randomHex } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour1 = artifacts.require('./AccountRegistry/epochs/1/Behaviour1');

const TestBehaviour = artifacts.require('./test/AccountRegistry/TestBehaviour');
const TestBehaviourEpoch = artifacts.require('./test/AccountRegistry/TestBehaviourEpoch');

const { ACCOUNT_REGISTRY_SIGNATURE } = devUtils.constants.eip712;

contract('Account registry manager', async (accounts) => {
    const owner = accounts[0];
    const opts = { from: owner };

    const aceAddress = randomHex(20);
    const trustedAddress = randomHex(20);

    describe('Success states', async () => {
        describe('Initialisation', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour1.new();
                manager = await AccountRegistryManager.new(opts);
            });

            it('should set manager contract owner', async () => {
                const managerOwner = await manager.owner();
                expect(managerOwner).to.equal(owner);
            });

            it('should deploy the Proxy contract', async () => {
                const initialBehaviourAddress = behaviour.address;
                const { receipt } = await manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress, opts);

                const setProxyAddress = await manager.proxy.call();
                const event = receipt.logs.find((l) => l.event === 'CreateProxy');
                expect(event.args.proxyAddress).to.equal(setProxyAddress);
                expect(receipt.status).to.equal(true);
            });

            it('should set Proxy admin as Manager contract on deploy', async () => {
                const initialBehaviourAddress = behaviour.address;
                const { receipt } = await manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress);
                const managerAddress = manager.address;
                const event = receipt.logs.find((l) => l.event === 'CreateProxy');
                expect(event.args.proxyAdmin).to.equal(managerAddress);
            });

            it('should update epoch number on proxy deploy', async () => {
                const preDeployEpoch = await manager.latestEpoch();
                expect(preDeployEpoch.toString()).to.equal('0');

                const initialBehaviourAddress = behaviour.address;
                await manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress);

                const postDeployEpoch = await manager.latestEpoch();
                expect(postDeployEpoch.toString()).to.equal('1');
            });
        });

        describe('Upgrade pattern', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour1.new();
                manager = await AccountRegistryManager.new(opts);

                const initialBehaviourAddress = behaviour.address;
                await manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress, opts);
            });

            it('should successfully register account mapping', async () => {
                // register an account with the extension, which will be put in storage under accountMapping
                const { privateKey, address } = secp256k1.generateAccount();
                const linkedPublicKey = keccak256('0x01');
                const spendingPublicKey = keccak256('0x0');

                const domain = signer.generateAccountRegistryDomainParams(behaviour.address);
                const message = {
                    account: address,
                    linkedPublicKey,
                };

                const encodedTypedData = typedData.encodeTypedData({
                    domain,
                    ...ACCOUNT_REGISTRY_SIGNATURE,
                    message,
                });

                const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

                const r = signature[1];
                const s = signature[2].slice(2);
                const v = signature[0].slice(-2);
                const sig = r + s + v;

                await behaviour.registerAZTECExtension(address, linkedPublicKey, spendingPublicKey, sig);

                const storedLinkedPublicKey = await behaviour.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey);
            });

            it('should upgrade to a new Account Registry behaviour contract', async () => {
                const testBehaviour = await TestBehaviour.new();
                const existingProxy = await manager.proxy.call();

                await manager.upgradeAccountRegistry(existingProxy, testBehaviour.address);

                const postUpgradeProxy = await manager.proxy.call();
                expect(postUpgradeProxy).to.equal(existingProxy);

                const newBehaviourAddress = await manager.getImplementation.call(existingProxy);
                const expectedNewBehaviourAddress = testBehaviour.address;
                expect(newBehaviourAddress).to.equal(expectedNewBehaviourAddress);

                const isNewFeatureImplemented = 'newFeature()' in testBehaviour.methods;
                expect(isNewFeatureImplemented).to.equal(true);
            });

            it('should keep state after upgrade', async () => {
                // register an account with the extension, which will be put in storage under accountMapping
                const { privateKey, address } = secp256k1.generateAccount();
                const linkedPublicKey = keccak256('0x01');
                const spendingPublicKey = keccak256('0x0');

                const domain = signer.generateAccountRegistryDomainParams(behaviour.address);
                const message = {
                    account: address,
                    linkedPublicKey,
                };

                const encodedTypedData = typedData.encodeTypedData({
                    domain,
                    ...ACCOUNT_REGISTRY_SIGNATURE,
                    message,
                });

                const signature = secp256k1.ecdsa.signMessage(encodedTypedData, privateKey);

                const r = signature[1];
                const s = signature[2].slice(2);
                const v = signature[0].slice(-2);
                const sig = r + s + v;

                await behaviour.registerAZTECExtension(address, linkedPublicKey, spendingPublicKey, sig);

                // perform upgrade, and confirm that registered linkedPublicKey is still present in storage
                const testBehaviour = await TestBehaviour.new();
                const preUpgradeProxy = await manager.proxy.call();
                await manager.upgradeAccountRegistry(preUpgradeProxy, testBehaviour.address);

                const storedLinkedPublicKey = await behaviour.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey);
            });

            it('should update latestEpoch number during upgrade', async () => {
                const preUpgradeEpoch = await manager.latestEpoch();
                expect(preUpgradeEpoch.toString()).to.equal('1');

                const testBehaviour = await TestBehaviour.new();
                const preUpgradeProxy = await manager.proxy.call();
                await manager.upgradeAccountRegistry(preUpgradeProxy, testBehaviour.address);

                const postUpgradeEpoch = await manager.latestEpoch();
                expect(postUpgradeEpoch.toString()).to.equal('2');
            });
        });
    });

    describe('Failure states', async () => {
        const fakeOwner = accounts[1];

        describe('Initialisation', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour1.new();
                manager = await AccountRegistryManager.new(opts);
            });

            it('should not deploy proxy if not owner', async () => {
                const initialBehaviourAddress = behaviour.address;
                await truffleAssert.reverts(
                    manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress, { from: fakeOwner }),
                    'Ownable: caller is not the owner',
                );
            });
        });

        describe('Upgrade flows', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour1.new();
                manager = await AccountRegistryManager.new(opts);

                const initialBehaviourAddress = behaviour.address;
                await manager.deployProxy(initialBehaviourAddress, aceAddress, trustedAddress, opts);
            });

            it('should not perform upgrade if not owner', async () => {
                const testBehaviour = await TestBehaviour.new();
                const preUpgradeProxy = await manager.proxy.call();

                await truffleAssert.reverts(
                    manager.upgradeAccountRegistry(preUpgradeProxy, testBehaviour.address, { from: fakeOwner }),
                    'Ownable: caller is not the owner',
                );
            });

            it('should not upgrade to a behaviour with a lower epoch than manager latest epoch', async () => {
                const testBehaviourEpoch = await TestBehaviourEpoch.new();
                const preUpgradeProxy = await manager.proxy.call();

                await truffleAssert.reverts(
                    manager.upgradeAccountRegistry(preUpgradeProxy, testBehaviourEpoch.address),
                    'expected new registry to be of epoch equal or greater than existing registry',
                );
            });
        });
    });
});
