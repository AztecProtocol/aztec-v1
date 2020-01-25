/* global artifacts */
const dotenv = require('dotenv');
const { fundRecipient } = require('@openzeppelin/gsn-helpers');
const { toWei } = require('web3-utils');

dotenv.config();
const AccountRegistryBehaviour = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager');
const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer, network) => {
    deployer.deploy(AccountRegistryBehaviour).then(async (contract) => {
        if (network === 'development') {
            const trustedGSNSignerAddress = process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);
        } else {
            const trustedGSNSignerAddress = process.env.TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);
        }
    });
};

