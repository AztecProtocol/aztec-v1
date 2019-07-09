import sessionModel from '~database/models/session';
import { KeyStore } from '~utils/keyvault/index';
import { get, set } from '~utils/storage';

export default {
    login: async ({ password, host }) => {
        const { keyStore } = await get(['keyStore']);
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, new Uint8Array(pwDerivedKey));

        if (!k.isDerivedKeyCorrect(new Uint8Array(pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }

        await set({
            session: {
                lastLogin: Date.now(),
                createdAt: Date.now(),
                pwDerivedKey,
            },
        });
        const session = await get('session');

        return session;
    },


};
