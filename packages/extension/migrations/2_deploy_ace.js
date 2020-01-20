/* global artifacts */
const bn128 = require('@aztec/bn128');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');

module.exports = (deployer) => {
    if (process.env.NODE_ENV === 'integration') {
        return deployer.deploy(ACE, {overwrite: false}).then(async (ace) => {
            await ace.setCommonReferenceString(bn128.CRS);
        });
    }

    return deployer.deploy(ACE).then(async (ace) => {
        await ace.setCommonReferenceString(bn128.CRS);
    });
};
