import { KeyStore } from '~utils/keyvault/index';
import { get, set } from '~utils/storage';

export default {
    login: async ({ password }) => {
        const { keyStore } = await get(['keyStore']);
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, new Uint8Array(pwDerivedKey));

        if (!k.isDerivedKeyCorrect(new Uint8Array(pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }

        const { session } = await set({
            session: {
                lastActive: Date.now(),
                createdAt: Date.now(),
                pwDerivedKey,
            },
        });


        return session;
    },


};
