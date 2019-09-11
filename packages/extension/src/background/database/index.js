import Dexie from 'dexie';
import clearDBModule from './utils/clearDB';

if (process.env.NODE_ENV === 'test') {
    Dexie.dependencies.indexedDB = require('fake-indexeddb');
    Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
}

const dbs = {};
const registerModelsCallbacks = [];

const ensureDB = (networkId) => {
    if (!dbs[networkId]) {
        const db = new Dexie(`aztec_network_${networkId}`);
        
        dbs[networkId] = db;

        registerModelsCallbacks.forEach(registerCallback => {
            registerCallback(db);
        });
    }
};


export const getDB = (networkId) => {
    ensureDB(networkId);
    return dbs[networkId];
};

export const storedNetworks = () => {
    return Object.keys(dbs);
};

export const registerModel = (registerCallback) => {
    registerModelsCallbacks.push(registerCallback);
};

export const clearDB = clearDBModule;

