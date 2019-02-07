/* global artifacts */
const Doorbell = artifacts.require('./Doorbell.sol');

module.exports = (deployer) => {
    deployer.deploy(Doorbell);
};
