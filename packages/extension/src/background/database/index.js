import Dexie from 'dexie';
import clearDBUtil from './utils/clearDB'

if (process.env.NODE_ENV === 'test') {
    Dexie.dependencies.indexedDB = require('fake-indexeddb');
    Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
}

const db = new Dexie('aztec_events_sync');

export default db;

// Utils
export const clearDB = clearDBUtil;