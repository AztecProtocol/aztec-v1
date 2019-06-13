const AZTECAccountRegistry = artifacts.require('./AZTECAccountRegistry.sol');

module.exports = (deployer) => {
    return deployer.deploy(AZTECAccountRegistry)
};
