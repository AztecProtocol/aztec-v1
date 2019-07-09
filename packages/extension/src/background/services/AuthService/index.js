import sessionModel from '~database/models/session';
import { get, set, remove } from '~utils/storage';
import { KeyStore } from '~utils/keyvault/index.js';
import sessionStorage from '../StorageService/sessionStorage';

export default {
    validate: async (_, { domain, asset }) => {
        if (!domain) {
            throw new Error('Domain is not present for the query ');
        }

        if (!asset) {
            throw new Error('Asset id is not present for the query ');
        }

        // we check the particular host has access
        // the extension session has a host chrome://extension/id
        
        const now = Date.now();
        const sessionKey =`s:${domain}`;
        const session = await sessionModel.get({
            id: sessionKey,
        });
        if (session.createdAt > now - 60 * 60 * 24 * 7) {
            // remove session not pwkey
            await remove([sessionKey]);
            throw new Error('The session is no longer active please login');
        }

        // the host has not been actibe in two days
        //
        if (session.lastActive > now - 60 * 60 * 24 * 2) {
            await remove([sessionKey]);
            throw new Error('The session is no longer active please login');
        }

        // we can now fetch the pwDerivedKey
        const { keyStore } = await get(['keyStore']);
        const k = KeyStore.deserialize(keyStore, new Uint8Array(pwDerivedKey));

        if (!k.isDerivedKeyCorrect(new Uint8Array(pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }

        // check if the user has granted the domain access to the given asset
        const { approvedDomains } = await assetModel.get({id: asset});

        if (!approvedDomains.indexOf(domain) === -1) {
            throw new Error(`The user has not granted the domain "${domain}" access`);
        }


        await sessionModel.set(sessionKey, {
            ...session,
            lastActive: now,
            session
        });

        return {
            session,
            pwDerivedKey,
            KeyStore: k,
        };
         
    },
    login: sessionStorage.login
};
