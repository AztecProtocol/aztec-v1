const secp256k1 = require('@aztec/secp256k1');
const bip39 = require('bip39');
const dotenv = require('dotenv');
const hdkey = require('ethereumjs-wallet/hdkey');

dotenv.config();
const mnemonic = process.env.TEST_MNEMONIC;
const seed = bip39.mnemonicToSeed(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);

const noteOwnerWallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
const { address, privateKey, publicKey } = secp256k1.accountFromPrivateKey(noteOwnerWallet.getPrivateKeyString());

module.exports = {
    address,
    privateKey,
    publicKey,
};
