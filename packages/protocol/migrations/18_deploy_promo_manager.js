/* global artifacts */
const dotenv = require('dotenv');
const { getContractAddressesForNetwork, NetworkId: networkIds } = require('@aztec/contract-addresses');

dotenv.config();
const PromoManager = artifacts.require('./PromoManager/PromoManager');
const ACE = artifacts.require('./ACE');
const ZkAsset = artifacts.require('./ZkAsset');
const ERC20 = artifacts.require('./ERC20Mintable');

module.exports = async (deployer, network) => {

    ace = await ACE.deployed();
    erc20 = await ERC20.deployed();
    zkAsset = await ZkAsset.deployed();
    return deployer.deploy(PromoManager, ace.address, zkAsset.address).then(async (promoManager) => {

        // Set the GSN signer address
        await promoManager.initialize(
            process.env.PROMO_NOTE_HASH,
            process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS,
        );
    });
};
