/* global artifacts, expect, contract, beforeEach, web3, it:true */
const { signer } = require('aztec.js');
const devUtils = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const typedData = require('@aztec/typed-data');
const truffleAssert = require('truffle-assertions');
const { keccak256, randomHex } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour = artifacts.require('./AccountRegistry/AccountRegistryBehaviour');
const BehaviourGSN = artifacts.require('./AccountRegistry/AccountRegistryBehaviourGSN');

const { ACCOUNT_REGISTRY_SIGNATURE } = devUtils.constants.eip712;

contract('Account registry manager', async (accounts) => {
    const owner = accounts[0];
    const opts = { from: owner };

    describe('Success states', async () => {
        describe('Initialisation', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour.new(opts);
                manager = await AccountRegistryManager.new(opts);
            });

            it('should set manager contract owner', async () => {
                const managerOwner = await manager.owner();
                expect(managerOwner).to.equal(owner);
            });

            it('should deploy the Proxy contract', async () => {
                const initialBehaviourAddress = behaviour.address;
                const { receipt } = await manager.deployProxy(initialBehaviourAddress, opts);

                const setProxyAddress = await manager.proxy.call();
                const event = receipt.logs.find((l) => l.event === 'CreateProxy');
                expect(event.args.proxyAddress).to.equal(setProxyAddress);
                expect(receipt.status).to.equal(true);
            });

            it('should set Proxy admin as Manager contract on deploy', async () => {
                const initialBehaviourAddress = behaviour.address;
                const { receipt } = await manager.deployProxy(initialBehaviourAddress);
                const managerAddress = manager.address;
                const event = receipt.logs.find((l) => l.event === 'CreateProxy');
                expect(event.args.proxyAdmin).to.equal(managerAddress);
            });
        });

        describe('Upgrade pattern', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour.new(opts);
                manager = await AccountRegistryManager.new(opts);

                const initialBehaviourAddress = behaviour.address;
                await manager.deployProxy(initialBehaviourAddress);
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

                await behaviour.registerAZTECExtension(
                    address,
                    linkedPublicKey,
                    spendingPublicKey,
                    sig,
                );

                const storedLinkedPublicKey = await behaviour.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey)
            });

            it('should upgrade to a new Account Registry behaviour contract', async () => {
                const newBehaviour = await BehaviourGSN.new(randomHex(20), randomHex(20), opts);

                const existingProxy = await manager.proxy.call();
                await manager.upgradeAccountRegistry(existingProxy, newBehaviour.address);

                // upgrade should not change the proxy
                const postUpgradeProxy = await manager.proxy.call();
                expect(postUpgradeProxy).to.equal(existingProxy);

                // should have upgraded to new behaviour
                const newBehaviourAddress = await manager.getImplementation.call(existingProxy);
                const expectedNewBehaviourAddress = newBehaviour.address;
                expect(newBehaviourAddress).to.equal(expectedNewBehaviourAddress);
            });

            it.only('should keep state after upgrade', async () => {
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

                await behaviour.registerAZTECExtension(
                    address,
                    linkedPublicKey,
                    spendingPublicKey,
                    sig,
                );

                // perform upgrade, and confirm that registered linkedPublicKey is still present in storage
                const newBehaviour = await BehaviourGSN.new(randomHex(20), randomHex(20), opts);
                const preUpgradeProxy = await manager.proxy.call();
                await manager.upgradeAccountRegistry(preUpgradeProxy, newBehaviour.address);

                const storedLinkedPublicKey = await behaviour.accountMapping.call(address);
                expect(storedLinkedPublicKey).to.equal(linkedPublicKey);
            });
        });
    });

    describe('Failure states', async () => {
        const fakeOwner = accounts[1];

        describe('Initialisation', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour.new(opts);
                manager = await AccountRegistryManager.new(opts);
            });

            it('should not deploy proxy if not owner', async () => {
                const initialBehaviourAddress = behaviour.address;
                await truffleAssert.reverts(
                    manager.deployProxy(initialBehaviourAddress, { from: fakeOwner }),
                    'Ownable: caller is not the owner',
                );
            });
        });

        describe('Upgrade flows', async () => {
            let behaviour;
            let manager;

            beforeEach(async () => {
                behaviour = await Behaviour.new(opts);
                manager = await AccountRegistryManager.new(opts);

                const initialBehaviourAddress = behaviour.address;
                await manager.deployProxy(initialBehaviourAddress);
            });

            it('should not perform upgrade if not owner', async () => {
                const newBehaviour = await BehaviourGSN.new(randomHex(20), randomHex(20), opts);
                const preUpgradeProxy = await manager.proxy.call();

                await truffleAssert.reverts(
                    manager.upgradeAccountRegistry(preUpgradeProxy, newBehaviour.address, { from: fakeOwner }),
                    'Ownable: caller is not the owner',
                );
            });
        });
    });
});
