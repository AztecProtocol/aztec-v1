/* global artifacts */
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const AZTEC = artifacts.require('./AZTEC.sol');
const AZTECERC20Bridge = artifacts.require('./AZTECERC20Bridge.sol');

const { params: { t2 } } = require('aztec.js');
const { constants: { DAI_ADDRESS, ERC20_SCALING_FACTOR } } = require('@aztec/dev-utils');

module.exports = (deployer, network) => {
    // just a bytecode switcheroo, nothing to see here...
    AZTECERC20Bridge.bytecode = AZTECERC20Bridge.bytecode.replace('AZTECInterface', 'AZTEC');
    AZTECERC20Bridge.deployedBytecode = AZTECERC20Bridge.deployedBytecode.replace('AZTECInterface', 'AZTEC');
    return deployer.deploy(AZTEC)
        .then(() => deployer.link(AZTEC, AZTECERC20Bridge))
        .then(() => {
            if (network === 'mainnet') {
                return Promise.resolve({ address: DAI_ADDRESS });
            }
            return deployer.deploy(ERC20Mintable);
        })
        .then(({ address: erc20Address }) => deployer
            .deploy(AZTECERC20Bridge, t2, erc20Address, ERC20_SCALING_FACTOR, deployer.network_id));
};
