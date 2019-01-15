/**
 * Module to dispatch transactions to the Ethereum network, plus some web3-based utility functions
 *
 * @module deployer
 */

const Tx = require('ethereumjs-tx');

const config = require('./config');
const web3 = require('./web3Listener');
const wallets = require('./resources/wallets');

// N.B. you must be running ganache-cli 6.2.5 or greater or this won't work - I think previous versions
// used EIP-155 to get the transaction hash, instead of hashing the rlp-encoded signed transaction
function getTransactionHash(transaction) {
    return `0x${transaction.hash(true).toString('hex')}`;
}

const deployer = {};

/**
 * Returns a function that will create a signed transaction for a smart contract method call
 *  and dispatch transaction to the network.
 * Useful for situations where we want to broadcast signed transactions (as opposed to unsigned transactions)
 * e.g. Infura, client-sign transaction signing.
 * @method methodWrapper
 * @param { Array } methodArguments Array containing method call's arguments
 * @param {Object} options transaction options
 * @param {Object} options.contract the web3 contract instance of the contract we're calling
 * @param {string} options.method the name of the method we're calling
 */
deployer.methodWrapper = (methodArguments, options) => {
    const { contract, method } = options;

    /**
     * @function broadcastSignedTransaction
     * @inner
     * @private
     * @memberof module:deployer
     * @description Creates signed transaction for contract call and dispatches to network
     *  (see: {@link module:deployer~methodWrapper})
     * @param {Object} wallet - wallet of transaction sender
     * @returns {Object} transactionHash and transactionPromise, which will resolve to the transaction receipt
     */
    return async function broadcastSignedTransaction(wallet) {
        const gas = (await contract.methods[method](...methodArguments).estimateGas({
            from: wallet.address,
            to: contract.contractAddress,
        }));
        const transaction = new Tx({
            nonce: wallet.nonce,
            gas: web3.utils.toHex(Math.floor(Number(gas) * 1.1)),
            gasPrice: web3.utils.toHex(web3.utils.toWei(config.gasPrice, 'gwei')),
            data: contract.methods[method](...methodArguments).encodeABI(),
            from: wallet.address,
            to: contract.contractAddress,
            chainId: web3.utils.toHex(await web3.eth.net.getId()),
        });
        transaction.sign(Buffer.from(wallet.privateKey.slice(2), 'hex'));
        const transactionHash = getTransactionHash(transaction);
        const transactionPromise = web3.eth.sendSignedTransaction(`0x${transaction.serialize().toString('hex')}`);

        wallets.update(
            wallet.address,
            { nonce: Number(wallet.nonce) + 1 }
        );
        return {
            transactionHash,
            transactionPromise,
        };
    };
};

/**
 * Call a smart contract function, by broadcasting a signed transaction to the Ethereum network.
 *  (see: {@link module:deployer~methodWrapper})
 * @method methodCall
 * @param { Array } methodArguments Array containing method call's arguments
 * @param {Object} options transaction options
 * @param {Object} options.contract the web3 contract instance of the contract we're calling
 * @param {string} options.method the name of the method we're calling
 * @param {Object} options.wallet the wallet of the transaction sender
 */
deployer.methodCall = async (methodArguments, { contract, method, wallet }) => {
    const methodCall = deployer.methodWrapper(methodArguments, { contract, method });
    const { transactionHash } = await methodCall(wallet);
    return transactionHash;
};

/**
 * Gets a transaction receipt from a transaction hash.
 * @method getTransactionReceipt
 * @param {string} transactionHash the hash of the signed transaction
 * @returns {Object} the transaction receipt
 */
deployer.getTransactionReceipt = async (transactionHash) => {
    return new Promise(async (resolve, reject) => {
        // timeout after 1 hour
        let remainingAttempts = 3600;
        let receipt;
        async function recurse() {
            try {
                receipt = await web3.eth.getTransactionReceipt(transactionHash);
            } catch (e) {
                console.error('error? ', e);
            }
            if (receipt) {
                resolve(receipt);
            } else {
                remainingAttempts -= 1;
                if (remainingAttempts) {
                    setTimeout(recurse, 1000);
                } else {
                    reject(new Error('receipt attempt timed out after 1000 attempts'));
                }
            }
        }
        await recurse();
    });
};

/**
 * Gets the raw transaction object from a transaction hash.
 * @method getTransaction
 * @param {string} transactionHash the hash of the signed transaction
 * @returns {Object} the transaction receipt
 */
deployer.getTransaction = async (transactionHash) => {
    return new Promise(async (resolve, reject) => {
        // timeout after 1 hour
        let remainingAttempts = 3600;
        let transaction;
        async function recurse() {
            transaction = await web3.eth.getTransaction(transactionHash);

            if (transaction) {
                resolve(transaction);
            } else {
                remainingAttempts -= 1;
                if (remainingAttempts) {
                    setTimeout(recurse, 1000);
                } else {
                    reject(new Error('receipt attempt timed out after 1000 attempts'));
                }
            }
        }
        await recurse();
    });
};

/**
 * Get the blockchain's network ID. Used to calculate EIP712 domain hashes
 * @method getNetwork
 * @returns {number} the network ID
 */
deployer.getNetwork = async () => {
    return web3.eth.net.getId();
};

deployer.web3 = web3;

module.exports = deployer;
