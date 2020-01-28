/* global artifacts */
const dotenv = require('dotenv');
const { fundRecipient } = require('@openzeppelin/gsn-helpers');
const { toWei } = require('web3-utils');
const Web3 = require('web3');

dotenv.config();
const AccountRegistryBehaviour = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer, network) => {
    deployer.deploy(AccountRegistryBehaviour).then(async (contract) => {
        if ((network === 'development' || network === 'test') && process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS) {
            const trustedGSNSignerAddress = process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);

            const WEB3_PROVIDER_URL = 'http://127.0.0.1:8545';
            const web3 = new Web3(WEB3_PROVIDER_URL);
            await fundRecipient(web3, {
                recipient: contract.address,
                amount: toWei('1'),
            });
        } else if (process.env.TRUSTED_GSN_SIGNER_ADDRESS) {
            const trustedGSNSignerAddress = process.env.TRUSTED_GSN_SIGNER_ADDRESS;
            await contract.initialize(ACE.address, trustedGSNSignerAddress);
        }
    });
};
