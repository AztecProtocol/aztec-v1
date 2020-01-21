/* global artifacts */
const EthFaucet = artifacts.require('./EthFaucet.sol');

module.exports = (deployer, network) => {
  deployer.deploy(
    EthFaucet,
    '0xA1e862D85419a57D588CD4566e558f5987cFa67E',
    // TODO change to be from env
    network === 'development' ? '0x24b934a7d1dd72bd8645a4958b0ff46bd29a5845' : '0x6794d16143e537a51d6745D3ae6bc99502b4331C', // RINKEBY
  );
};
