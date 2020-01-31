/* global artifacts */
const dotenv = require('dotenv');

dotenv.config();
const AccountRegistryManager = artifacts.require('./AccountRegistry/AccountRegistryManager.sol');

// fill this in when have the registry behaviour deployed
const AccountRegistryBehaviourAddress = '0x1C044Eb4B03DF7f25B02a167153262449eFb8FcE';
const ACEAddress = '0xb9Bb032206Da5B033a47E62D905F26269DAbE839';
console.log('trusted signer address: ', process.env.TRUSTED_GSN_SIGNER_ADDRESS);

module.exports = (deployer) => {
    return deployer.deploy(
        AccountRegistryManager,
        AccountRegistryBehaviourAddress,
        ACEAddress,
        process.env.TRUSTED_GSN_SIGNER_ADDRESS,
    );
};
