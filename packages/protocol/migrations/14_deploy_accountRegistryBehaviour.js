/* global artifacts */
const dotenv = require('dotenv');

dotenv.config();
const AccountRegistryBehaviour = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer, network) => {
    deployer.deploy(AccountRegistryBehaviour).then(async (contract) => {
        if ((network === 'development' || network === 'test') && process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS) {
            const trustedGSNSignerAddress = process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);
        } else if (process.env.TRUSTED_GSN_SIGNER_ADDRESS) {
            const trustedGSNSignerAddress = process.env.TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);
        }
    });
};
