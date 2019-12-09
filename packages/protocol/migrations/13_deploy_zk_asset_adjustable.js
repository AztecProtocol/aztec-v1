/* global artifacts */
const {
    constants: { ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('./ACE.sol');
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const ZkAssetAdjustable = artifacts.require('./ZkAssetAdjustable.sol');

module.exports = (deployer) => {
    if (isUndefined(ACE) || isUndefined(ACE.address)) {
        console.log('Please deploy the ACE contract first');
        process.exit(1);
    }

    /* eslint-disable no-new */
    new Promise(() => {
        return deployer.deploy(ERC20Mintable).then(({ address: erc20Address }) => {
            const aceAddress = ACE.address;
            return deployer.deploy(ZkAssetAdjustable, aceAddress, erc20Address, ERC20_SCALING_FACTOR, 0, []);
        });
    });
};
