/* global artifacts */
const {
    constants: { ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('./ACE.sol');
const BaseFactory = artifacts.require('./noteRegistry/epochs/201907/base/FactoryBase201907');

module.exports = (deployer) => {
    if (isUndefined(ACE) || isUndefined(ACE.address)) {
        console.log('Please deploy the ACE contract first');
        process.exit(1);
    }

    /* eslint-disable no-new */
    new Promise(() => {
        return deployer.deploy(BaseFactory, ACE.address).then(async ({ address }) => {
            const ace = await ACE.at(ACE.address);

            await ace.setFactory(1 * 256 ** 2 + 1 * 256 ** 1 + 1 * 256 ** 0, address);
        });
    });
};
