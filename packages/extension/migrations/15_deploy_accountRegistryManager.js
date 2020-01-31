/* global artifacts */
const dotenv = require('dotenv');

dotenv.config();
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager.sol');
const AccountRegistryBehaviour = artifacts.require('./AccountRegistry/epochs/20200106/Behaviour20200106');
const { fundRecipient } = require('@openzeppelin/gsn-helpers');
const { toWei } = require('web3-utils');
const Web3 = require('web3');

const ACE = artifacts.require('./ACE.sol');

module.exports = async (deployer, network) => {
    await deployer.deploy(
        AccountRegistryManager,
        AccountRegistryBehaviour.address,
        ACE.address,
        network === 'development' ? process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS : process.env.TRUSTED_GSN_SIGNER_ADDRESS,
    );

    const contract = await AccountRegistryManager.deployed();
    const proxyAddress = await contract.proxyAddress.call();

    const WEB3_PROVIDER_URL = 'http://127.0.0.1:8545';
    const web3 = new Web3(WEB3_PROVIDER_URL);

    await fundRecipient(web3, {
        recipient: proxyAddress,
        amount: toWei('1'),
    });
};
