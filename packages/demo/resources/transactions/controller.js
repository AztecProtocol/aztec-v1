/**
 * Exposes an interface to create, read and update Ethereum transactions.
 *
 * @module transactionsController
 */

const db = require('./db');
const deployer = require('../../deployer');
const { TX_TYPES, TX_STATUS } = require('../../config');

const transactionsController = {};

/**
 * Create a new transaction entry. Does not broadcast transaction to network
 * (see: {@link module:deployer~methodWrapper})).
 * @method newTransaction
 * @param {module:config.TX_TYPES} transactionType the type enum of the transaction
 * @param {string} transactionHash the Ethereum transaction hash
 */
transactionsController.newTransaction = (transactionType, transactionHash) => {
    if (!TX_TYPES[transactionType]) {
        throw new Error(`${transactionType} is not a valid transaction type!`);
    }
    return db.create({
        status: TX_STATUS.SENT,
        transactionType,
        transactionHash,
    });
};

/**
 * Set a transaction's status to mined {@link module:config.TX_TYPES} and attach transation receipt data
 * @method updateMinedTransaction
 * @param {string} transactionHash the Ethereum transaction hash
 * @param {Object} transactionReceipt the transaction receipt object
 * @param {Object} [transactionData] the input transaction data object
 */
transactionsController.updateMinedTransaction = (transactionHash, transactionReceipt, transactionData = {}) => {
    const res = db.update(transactionHash, {
        status: TX_STATUS.MINED,
        transactionReceipt,
        transactionData,
    });
    return res;
};

/**
 * Get a transaction by its transaction hash
 * @method get
 * @param {string} transactionHash the Ethereum transaction hash
 * @returns {Object} the transaction object
 */
transactionsController.get = (transactionHash) => {
    return db.get(transactionHash);
};

/**
 * Get a transaction's transaction receipt object and update transaction's database entry
 * @method getTransactionReceipt
 * @param {string} transactionHash the Ethereum transaction hash
 * @returns {Object} the transaction receipt object
 */
transactionsController.getTransactionReceipt = async (transactionHash) => {
    const transaction = transactionsController.get(transactionHash);
    if (!transaction) {
        throw new Error(`could not find transaction ${transactionHash}`);
    }
    const transactionReceipt = await deployer.getTransactionReceipt(transactionHash);
    transactionsController.updateMinedTransaction(transactionHash, transactionReceipt);
    return transactionReceipt;
};

module.exports = transactionsController;
