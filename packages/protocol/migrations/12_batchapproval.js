/* global artifacts */
const BatchApproval = artifacts.require('./BatchApproval.sol');
const ACE = artifacts.require('./ACE.sol');

module.exports = async (deployer) => {
    const aceContract = await ACE.deployed();
    await deployer.deploy(BatchApproval, aceContract.address);
};
