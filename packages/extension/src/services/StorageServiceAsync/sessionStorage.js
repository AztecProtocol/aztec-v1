import { KeyStore } from '../../utils/keyvault/index.js';
import { get, set, remove } from '../../utils/storage';
import dataToKey from '../../utils/dataToKey';
import Storage from './Storage';


class SessionStorage extends Storage {
    async checkSession(host) {
        // we check the particular host has access
        // www.creditmint.io
        // the extension session has a host chrome://extension/id
        const now = Date.now();
        const session = await get('session');
        if (session.createdAt > now - 60 * 60 * 24 * 7) {
            // remove session not pwkey
            await remove('pwDerivedKey');
            throw new Error('The session is no longer active please login');
        }

        // the host has not been actibe in two days
        if (session.lastActive > now - 60 * 60 * 24 * 2) {
            await remove('pwDerivedKey');
            throw new Error('The session is no longer active please login');
        }

        // we can now fetch the pwDerivedKey
        const { pwDerivedKey, keyStore } = await get(['pwDerivedKey', 'keyStore']);
        const k = KeyStore.deserialize(keyStore, new Uint8Array(pwDerivedKey));
        if (!k.isDerivedKeyCorrect(new Uint8Array(pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }

        await set(`s:${host}`, {
            ...session,
            lastActive: now,
        });

        return {
            session,
            pwDerivedKey,
            KeyStore: k,
        };
    }

    async createSession(host) {
        // TODO figure out lock

        const activeSessions = await this.lock(
            ['activeSession', `s:${host}`],
            async () => set({
                [`s:${host}`]: {
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    loginCount: 1,
                },
                activeSessions: [],
            }),
        );
    }

    async logout() {
        await remove(['session', 'pwDerivedKey']);
    }

    async login(password) {
        // by default we log in to the extension host
        const { keyStore } = await get(['keyStore']);
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, new Uint8Array(pwDerivedKey));

        if (!k.isDerivedKeyCorrect(new Uint8Array(pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }
        // password is valid we can create the extension
        await set({
            session: {
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                loginCount: 1,
            },
            pwDerivedKey,
        });
    }
}

export default new SessionStorage();
