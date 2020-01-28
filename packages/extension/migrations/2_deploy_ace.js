/* global artifacts */
const bn128 = require('@aztec/bn128');

const ACE = artifacts.require('./ACE.sol');

module.exports = (deployer) => {
    return deployer.deploy(ACE).then(async (ace) => {
        await ace.setCommonReferenceString(bn128.CRS);
    });
};
