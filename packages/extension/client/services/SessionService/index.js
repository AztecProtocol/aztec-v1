import KeyStore from '../KeyVault/index.js';
import {
    get,
    set,
} from '../../utils/storage';
import dataToKey from '../../utils/dataToKey';
import Storage from './Storage';


class SessionStorage extends Storage {
    async checkSession(host) {
        // we check the particular host has access
        // www.creditmint.io
        // the extension also has a host chrome://extension/id
        const now = Date.now();
        const session = await StorageServiceAsync.get(`s:${host}`);
        if (session.createdAt > now - 60 * 60 * 24 * 7) {
            await StorageServiceAsync.delete('pwDerivedKey');
            throw new Error('The session is no longer active please login');
        }

        // the host has not been actibe in two days
        if (session.lastActive > now - 60 * 60 * 24 * 2) {
            await StorageServiceAsync.delete('pwDerivedKey');
            throw new Error('The session is no longer active please login');
        }

        // we can now fetch the pwDerivedKey
        const pwDerivedKey = await StorageServiceAsync.get('pwDerivedKey');

        assert(KeyStore.isDerivedKeyCorrect(pwDerivedKey), 'derrived key should be correct');

        await StorageServiceAsync.set(`s:${host}`, {
            ...session,
            lastActive: now
        });

        return {
            session,
            pwDerivedKey,
        };

    }
    async logout()  {
        await StorageServiceAsync.delete('pwDerivedKey');
    }
}

export default new SessionStorage();

