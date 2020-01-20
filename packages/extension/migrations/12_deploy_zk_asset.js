/* global artifacts */
const {
    constants: { addresses, ERC20_SCALING_FACTOR },
} = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const ERC20Mintable = artifacts.require('@aztec/protocol/contracts/ERC20/ERC20Mintable.sol');
const ZkAsset = artifacts.require('@aztec/protocol/contracts/ERC1724/ZkAsset.sol');

module.exports = (deployer, network) => {
    // if (isUndefined(ACE) || isUndefined(ACE.address)) {
    //     console.log('Please deploy the ACE contract first');
    //     process.exit(1);
    // }

    // /* eslint-disable no-new */
    // new Promise(() => {
    //     if (network === 'mainnet') {
    //         return Promise.resolve({ address: addresses.DAI_ADDRESS });
    //     }
    //     return deployer.deploy(ERC20Mintable).then(({ address: erc20Address }) => {
    //         const aceAddress = ACE.address;
    //         return deployer.deploy(ZkAsset, aceAddress, erc20Address, ERC20_SCALING_FACTOR);
    //     });
    // });
};
