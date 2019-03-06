/* global artifacts */
const { constants: { DAI_ADDRESS, ERC20_SCALING_FACTOR } } = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('./ACE.sol');
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const ZKERC20 = artifacts.require('./ZKERC20.sol');

module.exports = (deployer, network) => {
    if (isUndefined(ACE) || isUndefined(ACE.address)) {
        console.log('Please deploy the ACE contract first');
        process.exit(1);
    }

    /* eslint-disable no-new */
    new Promise(() => {
        if (network === 'mainnet') {
            return Promise.resolve({ address: DAI_ADDRESS });
        }
        return deployer.deploy(ERC20Mintable).then(({ address: erc20Address }) => {
            const aceAddress = ACE.address;
            const canMint = false;
            const canBurn = false;
            const canConvert = true;
            const isOpen = true;
            return deployer.deploy(
                ZKERC20,
                'Cocoa',
                canMint,
                canBurn,
                canConvert,
                ERC20_SCALING_FACTOR,
                erc20Address,
                aceAddress,
                isOpen
            );
        });
    });
};
