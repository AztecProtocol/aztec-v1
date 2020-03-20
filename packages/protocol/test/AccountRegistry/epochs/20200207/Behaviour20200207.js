/* global contract, artifacts, expect */
const { randomHex } = require('web3-utils');

const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const Behaviour20200106 = artifacts.require('./Behaviour20200106');
const Behaviour20200207 = artifacts.require('./Behaviour20200207');

contract('AccountRegistry: Behaviour20200207', async (accounts) => {
    let behaviour20200106;
    let proxyContract;

    let initialBehaviourAddress;

    const initialGSNSignerAddress = randomHex(20);
    const aceAddress = randomHex(20);
    const updatedGSNSignerAddress = '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8';

    const owner = accounts[0];
    const opts = { from: owner };

    let manager;

    describe('Success states', async () => {
        beforeEach(async () => {
            // initial behaviour contract
            behaviour20200106 = await Behaviour20200106.new();
            initialBehaviourAddress = behaviour20200106.address;

            manager = await AccountRegistryManager.new(initialBehaviourAddress, aceAddress, initialGSNSignerAddress, opts);

            // new behaviour contract
            const behaviour20200207 = await Behaviour20200207.new();

            // perform the upgrade
            await manager.upgradeAccountRegistry(behaviour20200207.address);
            const proxyAddress = await manager.proxyAddress();
            proxyContract = await Behaviour20200207.at(proxyAddress);
        });

        it('should set the GSN signer address', async () => {
            const { receipt } = await proxyContract.setGSNSigner();
            expect(receipt.status).to.equal(true);

            const updatedGSNSigner = await proxyContract.GSNSigner();
            expect(updatedGSNSigner.toString()).to.equal(updatedGSNSignerAddress);
        });
    });
});
