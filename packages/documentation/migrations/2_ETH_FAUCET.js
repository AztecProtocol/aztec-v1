/* global artifacts */
const EthFaucet = artifacts.require('./EthFaucet.sol');

module.exports = (deployer, network) => {
    deployer.deploy(
        EthFaucet,
        '0xA1e862D85419a57D588CD4566e558f5987cFa67E',
        // TODO change to be from env
        network === 'development' ? '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8' : '0x5323B6bbD3421983323b3f4f0B11c2D6D3bCE1d8', // RINKEBY
    );
};
