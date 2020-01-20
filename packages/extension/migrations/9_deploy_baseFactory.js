/* global artifacts */
const {
    constants: { ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const BaseFactory = artifacts.require('@aztec/protocol/contracts/ACE/noteRegistry/epochs/201907/base/FactoryBase201907');

module.exports = (deployer) => {
    if (isUndefined(ACE) || isUndefined(ACE.address)) {
        console.log('Please deploy the ACE contract first');
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'integration') {
        /* eslint-disable no-new */
        new Promise(() => {
            return deployer.deploy(BaseFactory, ACE.address, {overwrite: false}).then(async ({ address }) => {
                const ace = await ACE.at(ACE.address);
                try {
                    await ace.setFactory(1 * 256 ** 2 + 1 * 256 ** 1 + 1 * 256 ** 0, address);
                } catch (e) {}
            });
        });
    }

    /* eslint-disable no-new */
    new Promise(() => {
        return deployer.deploy(BaseFactory, ACE.address).then(async ({ address }) => {
            const ace = await ACE.at(ACE.address);
            try {
                await ace.setFactory(1 * 256 ** 2 + 1 * 256 ** 1 + 1 * 256 ** 0, address);
            } catch (e) {}
        });
    });
};
