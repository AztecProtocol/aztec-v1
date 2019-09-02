/* global artifacts */
const Wallet = artifacts.require('./Wallet.sol');
const ACE = artifacts.require('./ACE.sol');

module.exports = async (deployer) => {
    const aceContract = await ACE.deployed();
    await deployer.deploy(Wallet, aceContract.address);
};
