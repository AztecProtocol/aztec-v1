/* global artifacts */
const ACE = artifacts.require('./ACE.sol');
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const zkERC20 = artifacts.require('./zkERC20.sol');

const { constants: { DAI_ADDRESS, ERC20_SCALING_FACTOR } } = require('@aztec/dev-utils');

module.exports = (deployer, network) => {
    let aceAddress = '';

    deployer.deploy(ACE)
        .then((receipt) => {
            aceAddress = receipt.address;
            if (network === 'mainnet') {
                return Promise.resolve({ address: DAI_ADDRESS });
            }
            return Promise.resolve({ address: ERC20Mintable.address });
        })
        .then(({ address: erc20Address }) => {
            return deployer.deploy(zkERC20, 'Cocoa', true, true, true, ERC20_SCALING_FACTOR, erc20Address, aceAddress);
        });
};
