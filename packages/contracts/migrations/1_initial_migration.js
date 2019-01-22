/* global artifacts, beforeEach, it:true */
const Migrations = artifacts.require('./Migrations.sol');

module.exports = (deployer) => {
    deployer.deploy(Migrations);
};
