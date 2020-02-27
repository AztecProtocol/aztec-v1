/* global artifacts */
const dotenv = require('dotenv');
const { getContractAddressesForNetwork, NetworkId: networkIds } = require('@aztec/contract-addresses');

dotenv.config();
const PromoManager = artifacts.require('./PromoManager/PromoManager');
const ACE = artifacts.require('./ACE');
const ERC20 = artifacts.require('./ERC20Mintable');

module.exports = (deployer, network) => {
    return deployer.deploy(PromoManager).then(async (promoManager) => {

        // Set the GSN signer address
        ace = await ACE.deployed();
        erc20 = await ERC20.deployed();
        await promoManager.initialize(
            ace.address,
            process.env.LOCAL_TRUSTED_GSN_SIGNER_ADDRESS,
            erc20.address,
            zkAsset.address,
            process.env.PROMO_NOTE_HASH,
        );
    });
};
