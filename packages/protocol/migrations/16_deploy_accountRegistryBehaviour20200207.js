/* global artifacts */
const dotenv = require('dotenv');
const { getContractAddressesForNetwork } = require('@aztec/contract-addresses');

dotenv.config();
const AccountRegistryBehaviour20200207 = artifacts.require('./AccountRegistry/epochs/20200207/Behaviour20200207');
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');

module.exports = (deployer, network) => {
    return deployer.deploy(AccountRegistryBehaviour20200207).then(async (behaviourContract) => {
        const isLocal = network === 'development' || network === 'test';

        if (!isLocal) {
            // Get the manager contract instance
            const { AccountRegistryManager: managerAddress } = getContractAddressesForNetwork(network);
            const managerContract = AccountRegistryManager.at(managerAddress);

            // Perform the upgrade
            await managerContract.upgradeAccountRegistry(behaviourContract.address);

            // Get the proxy contract instance
            const proxyAddress = await managerContract.proxyAddress();
            const proxyContract = await AccountRegistryBehaviour20200207.at(proxyAddress);

            // Set the GSN signer address
            await proxyContract.setGSNSigner();
        }
    });
};
