import Dexie from 'dexie';
import clearDb from './utils/clearDb'

if (process.env.NODE_ENV === 'test') {
    Dexie.dependencies.indexedDB = require('fake-indexeddb');
    Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange');
}

const db = new Dexie('aztec_events_sync');

db.clearDb = clearDb;

export default db;