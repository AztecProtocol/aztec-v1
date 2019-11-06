import Dexie from 'dexie';
import '../env';

const windowCrypto = require('@trust/webcrypto');

global.crypto = windowCrypto;

// IndexedDB
Dexie.dependencies.indexedDB = require('fake-indexeddb'); // eslint-disable-line global-require
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange'); // eslint-disable-line global-require
