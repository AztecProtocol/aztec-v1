/* global artifacts */
const dotenv = require('dotenv');

dotenv.config();
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager.sol');
const AccountRegistryBehaviour = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer, network) => {
    if (process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS || process.env.TRUSTED_GSN_SIGNER_ADDRESS) {
        const useLocal = network === 'development' || network === 'test';
        deployer.deploy(
            AccountRegistryManager,
            AccountRegistryBehaviour.address,
            ACE.address,
        );
            useLocal ? process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS : process.env.TRUSTED_GSN_SIGNER_ADDRESS,
    }
};
