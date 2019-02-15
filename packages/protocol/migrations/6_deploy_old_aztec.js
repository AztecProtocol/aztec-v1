/* global artifacts */
const { constants: { DAI_ADDRESS, ERC20_SCALING_FACTOR, t2 } } = require('@aztec/dev-utils');
const { isUndefined } = require('lodash');

const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const AZTEC = artifacts.require('./AZTEC.sol');
const AZTECERC20Bridge = artifacts.require('./AZTECERC20Bridge.sol');

module.exports = (deployer, network) => {
    if (isUndefined(ERC20Mintable) || isUndefined(ERC20Mintable.address)) {
        console.log('Please deploy the ERC20Mintable contract first');
        process.exit(1);
    }

    // just a bytecode switcheroo, nothing to see here...
    AZTECERC20Bridge.bytecode = AZTECERC20Bridge.bytecode.replace('AZTECInterface', 'AZTEC');
    AZTECERC20Bridge.deployedBytecode = AZTECERC20Bridge.deployedBytecode.replace('AZTECInterface', 'AZTEC');
    return deployer.deploy(AZTEC)
        .then(() => deployer.link(AZTEC, AZTECERC20Bridge))
        .then(() => {
            if (network === 'mainnet') {
                return Promise.resolve({ address: DAI_ADDRESS });
            }
            return Promise.resolve({ address: ERC20Mintable.address });
        })
        .then(({ address: erc20Address }) => deployer
            .deploy(AZTECERC20Bridge, t2, erc20Address, ERC20_SCALING_FACTOR));
};
