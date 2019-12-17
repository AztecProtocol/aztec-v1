/* global artifacts, expect, contract, beforeEach, web3, it:true */
const { toChecksumAddress } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const AdminUpgradeabilityProxy = artifacts.require('./Proxies/AdminUpgradeabilityProxy.sol');
const Behaviour = artifacts.require('./AccountRegistry/AccountRegistryBehaviour');
const BehaviourGSN = require('./AccountRegistry/AccountRegistryBehaviourGSN');

contract('Account registry manager', async (accounts) => {
    const owner = accounts[0];
    const opts = { from: owner };

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
            const { receipt } = await manager.deployProxy(initialBehaviourAddress);

            const setProxyAddress = (await manager.deployedProxy.call()).toString();
            const event = receipt.logs.find((l) => l.event === 'CreateProxy');
            expect(event.args.proxyAddress).to.not.equal(undefined);
            expect(event.args.proxy).to.equal(setProxyAddress)
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

        it('should upgrade to a new Account Registry behaviour contract', async () => {
        });

        it('should emit correct events on upgrade', async () => {});

        it('should keep state after upgrade', async () => {});
    });
});
