/* global artifacts */
const {
    constants: { ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('./ACE.sol');
const ConvertibleFactory = artifacts.require('./noteRegistry/epochs/201907/convertible/FactoryConvertible201907');
const AdjustableFactory = artifacts.require('./noteRegistry/epochs/201907/adjustable/FactoryAdjustable201907');
const MixedFactory = artifacts.require('./noteRegistry/epochs/201907/mixed/FactoryMixed201907');

module.exports = (deployer) => {
    if (isUndefined(ACE) || isUndefined(ACE.address)) {
        console.log('Please deploy the ACE contract first');
        process.exit(1);
    }

    /* eslint-disable no-new */
    new Promise(() => {
        return deployer.deploy(ConvertibleFactory, ACE.address).then(async ({ address }) => {
            const ace = await ACE.at(ACE.address);
            // const adjustableFactoryAddress = await AdjustableFactory.new(ACE.address);
            // const mixedFactoryAddress = await MixedFactory.new(ACE.address);

            await ace.setFactory(1 * 256**(2) + 1 * 256**(1) + 1 * 256**(0), address);
            // await ace.setFactory(1 * 256**(2) + 1 * 256**(1) + 2 * 256**(0), adjustableFactoryAddress);
            // await ace.setFactory(1 * 256**(2) + 1 * 256**(1) + 3 * 256**(0), mixedFactoryAddress);
        });
    });
};
