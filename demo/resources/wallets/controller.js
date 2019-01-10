/**
 * Exposes an interface to create and interact with AZTEC wallets.  
 * To keep the proof of concept simple this controller doesn't support stealth wallets yet.  
 * Stay tuned for updates!
 *
 * @module walletController
 */

const web3Utils = require('web3-utils');

const accounts = require('../../../accounts');
const db = require('./db');
const web3 = require('../../web3Listener');
const secp256k1 = require('../../../aztec-crypto-js/secp256k1');

const walletController = {};


/**
 * Create a wallet entry from an Ethereum public key. Can't be used to sign transactions
 * @method createFromPublicKey
 * @param {string} publicKey hex-string of uncompressed public key (64 bytes)
 * @param {string} name the name of this wallet
 */
walletController.createFromPublicKey = function createFromPublicKey(publicKey, name) {
    const publicHash = web3Utils.sha3(publicKey);
    const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
    const wallet = {
        name,
        publicKey,
        address,
        nonce: 0,
    };
    return db.create(wallet);
};

/**
 * Create a wallet entry from an Ethereum private key.
 * @method createFromPrivateKey
 * @param {string} publicKey hex-string formatted private key
 * @param {string} name the name of this wallet
 */
walletController.createFromPrivateKey = function createFromPrivateKey(privateKey, name) {
    const { publicKey, address } = secp256k1.accountFromPrivateKey(privateKey);
    const wallet = {
        name,
        privateKey,
        publicKey,
        address,
        nonce: 0,
    };
    return db.create(wallet);
};

/**
 * Get a wallet entry by Ethereum address
 * @method createFromPrivateKey
 * @param {string} address hex-string formatted Ethereum address
 * @returns {Object} the wallet object
 */
walletController.get = function get(address) {
    const wallet = db.get(address);
    if (!wallet) {
        throw new Error(`could not find wallet at address ${address}`);
    }
    return wallet;
};

/**
 * Update a wallet with new data
 * @method update
 * @param {string} address hex-string formatted Ethereum address
 * @param {Object} data data to add/change in wallet
 * @returns {Object} the new wallet object
 */
walletController.update = function update(address, data) {
    const wallet = db.get(address);
    if (!wallet) {
        throw new Error(`could not find wallet at address ${address}`);
    }
    return db.update(address, {
        ...wallet,
        ...data,
    });
};

/**
 * Initialize a wallet. Will update the wallet's nonce with latest on-chain value.  
 * If wallet address does not exist, will look in 'accounts.json' for a matching entry
 * @method init
 * @param {string} address hex-string formatted Ethereum address
 */
walletController.init = async function init(address) {
    const wallet = db.get(address);
    if (!wallet) {
        // wallet doesn't exist in db, check private key store
        let account = null;
        if (accounts) {
            account = accounts.keys.find(t => (t.address === address));
        }
        if (!account) {
            throw new Error(`could not find account in db or keystore that corresponds to ${address}`);
        }
        walletController.createFromPrivateKey(account.private, address);
    }

    const nonce = await web3.eth.getTransactionCount(address);
    walletController.update(address, {
        nonce,
    });
};


module.exports = walletController;
