/* global artifacts */
const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer) => {
    return deployer.deploy(ACE);
};
