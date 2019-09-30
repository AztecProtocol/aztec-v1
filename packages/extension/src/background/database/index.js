import Dexie from 'dexie';


if (process.env.NODE_ENV === 'test') {
    Dexie.dependencies.indexedDB = require('fake-indexeddb'); // eslint-disable-line global-require
    Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange'); // eslint-disable-line global-require
}

const dbs = {};
const registerModelsCallbacks = [];

const ensureDB = (networkId) => {
    if (!dbs[networkId]) {
        const db = new Dexie(`aztec_network_${networkId}`);

        dbs[networkId] = db;

        registerModelsCallbacks.forEach(registerCallback => registerCallback(db));
    }
};


export const getDB = (networkId) => {
    ensureDB(networkId);
    return dbs[networkId];
};

export const storedNetworks = () => Object.keys(dbs);

export const registerModel = (registerCallback) => {
    registerModelsCallbacks.push(registerCallback);
};
