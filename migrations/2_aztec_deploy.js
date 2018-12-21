/* global artifacts */
const ERC20Mintable = artifacts.require('./ERC20Mintable.sol');
const AZTEC = artifacts.require('./AZTEC.sol');
const AZTECERC20Bridge = artifacts.require('./AZTECERC20Bridge.sol');

const { t2 } = require('../aztec-crypto-js/params');
const { daiAddress, erc20ScalingFactor } = require('../demo/config');

module.exports = (deployer, network) => {
    // just a bytecode switcheroo, nothing to see here...
    AZTECERC20Bridge.bytecode = AZTECERC20Bridge.bytecode.replace('AZTECInterface', 'AZTEC');
    AZTECERC20Bridge.deployedBytecode = AZTECERC20Bridge.deployedBytecode.replace('AZTECInterface', 'AZTEC');
    return deployer.deploy(AZTEC)
        .then(() => deployer.link(AZTEC, AZTECERC20Bridge))
        .then(() => {
            if (network === 'mainnet') {
                return Promise.resolve({ address: daiAddress });
            }
            return deployer.deploy(ERC20Mintable);
        })
        .then(({ address: erc20Address }) => deployer
            .deploy(AZTECERC20Bridge, t2, erc20Address, erc20ScalingFactor, deployer.network_id));
};
