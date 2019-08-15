const ACE = artifacts.require('@aztec/protocol/contracts/ACE/ACE.sol');
const ERC20Mintable = artifacts.require('@aztec/protocol/contracts/ERC20/ERC20Mintable.sol');
const ZkAssetTemplate = artifacts.require('./ZkAssetTemplate.sol');

module.exports = (deployer) => {
    return deployer.deploy(
        ZkAssetTemplate,
        ACE.address,
        ERC20Mintable.address,
        1,
    );
};
