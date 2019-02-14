/* global artifacts */
const { constants: { CRS } } = require('@aztec/dev-utils');

const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer) => {
    return deployer.deploy(ACE).then(async (ace) => {
        await ace.setCommonReferenceString(CRS);
    });
};
