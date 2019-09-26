/* global artifacts */
const bn128 = require('@aztec/bn128');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');

module.exports = (deployer) => {
    return deployer.deploy(ACE).then(async (ace) => {
        await ace.setCommonReferenceString(bn128.CRS);
    });
};
