import Dexie from 'dexie';

const windowCrypto = require('@trust/webcrypto');

global.crypto = windowCrypto;
global.chrome = require('sinon-chrome');

// IndexedDB
Dexie.dependencies.indexedDB = require('fake-indexeddb'); // eslint-disable-line global-require
Dexie.dependencies.IDBKeyRange = require('fake-indexeddb/lib/FDBKeyRange'); // eslint-disable-line global-require