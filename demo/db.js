/**
 * Provides access to lowdb database objects that store wallet, AZTEC note and Ethereum transaction data
 *
 * @module db
 */

// external dependencies
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// internal dependencies
const config = require('./config');


const partialPath = path.posix.resolve(__dirname, '');

const adapter = new FileSync(path.posix.resolve(partialPath, config.db));
const databaseObject = low(adapter);

const walletsDatabaseName = (config.env === 'TEST' || config.env === 'DEVELOPMENT') ? 'testWallets.json' : 'wallets.json';
const walletAdapter = new FileSync(path.posix.resolve(partialPath, walletsDatabaseName));
const walletsDatabaseObject = low(walletAdapter);

// Set some defaults (required if your JSON file is empty)
function initialState() {
    return { transactions: [], notes: [] };
}

function walletsInitialState() {
    return { wallets: [] };
}

const db = {};

/**
 * Retrieve lowdb object that stores transactions and notes
 *
 * @method database
 * @returns {Object} the lowdb database object
 */
db.database = () => databaseObject;

/**
 * Retrieve lowdb object that stores wallets. This db stores private keys so don't commit or share it!
 *
 * @method walletsDatabase
 * @returns {Object} the lowdb database object
 */
db.walletsDatabase = () => walletsDatabaseObject;

/**
 * Reset database back to initial state
 *
 * @method clear
 */
db.clear = () => {
    db.database().setState(initialState());
    db.walletsDatabase().setState(walletsInitialState());
};

// Set up initial state before exporting
db.database().defaults(initialState()).write();
db.walletsDatabase().defaults(walletsInitialState()).write();

module.exports = db;
