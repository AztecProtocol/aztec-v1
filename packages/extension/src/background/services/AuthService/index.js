import domainModel from '~database/models/domain';
import userModel from '~database/models/user';
import {
    get,
    set,
    remove,
} from '~utils/storage';
import {
    KeyStore,
} from '~utils/keyvault';
import {
    permissionError,
} from '~utils/error';
import SyncService from '~background/services/SyncService';
import enableAssetForDomain from './enableAssetForDomain';

const AuthService = {
    getKeyStore: async () => get('keyStore'),
    getSession: async () => {
        const session = await get('session');
        const {
            pwDerivedKey,
        } = session || {};

        if (!pwDerivedKey) {
            return session;
        }

        return {
            ...session,
            pwDerivedKey: new Uint8Array(Object.values(JSON.parse(pwDerivedKey))),
        };
    },
    getRegisteredDomain: async domainName => domainModel.get({
        domain: domainName,
    }),
    getDomainApprovedAssets: async (domainName) => {
        const {
            assets,
        } = await domainModel.get({
            domain: domainName,
        }) || {};

        return assets || [];
    },
    getRegisteredUser: async (address) => {
        const user = await userModel.get({
            address,
        });

        return user && user.registeredAt
            ? user
            : null;
    },
    getCurrentUser: async () => {
        const session = await get('session');
        return session && session.address;
    },
    updateSession: async (address) => {
        const prevSession = await get('session');
        const session = {
            ...prevSession,
            address,
            lastActive: Date.now(),
        };

        await set({
            session,
        });

        return session;
    },
    removeSession: async () => remove('session'),
    registerExtension: async ({
        password,
        salt,
        address,
        seedPhrase,
    }) => {
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt,
        });
        const mnemonic = seedPhrase;

        const keyStore = new KeyStore({
            pwDerivedKey,
            salt,
            mnemonic,
            hdPathString: "m/44'/60'/0'/0",
        });

        await set({
            keyStore,
            session: {
                pwDerivedKey: JSON.stringify(pwDerivedKey),
                lastActive: Date.now(),
                createdAt: Date.now(),
                address,
            },
        });

        // TODO: clear storage

        const linkedPublicKey = keyStore.privacyKeys.publicKey;

        let user = await userModel.get({
            address,
        });
        if (!user
            || user.linkedPublicKey !== linkedPublicKey
        ) {
            user = {
                address,
                linkedPublicKey,
            };

            await userModel.set(user, {
                forceReplace: true,
            });
        }

        return user;
    },
    registerAddress: async ({
        address,
        linkedPublicKey,
        linkedPrivateKey,
        registeredAt,
    }) => {
        let user = await userModel.get({
            address,
        });

        if (!user
            || user.linkedPublicKey !== linkedPublicKey
            || user.registeredAt !== registeredAt
        ) {
            user = {
                address,
                linkedPublicKey,
                registeredAt,
            };

            await userModel.set(
                user,
                {
                    forceReplace: true,
                },
            );

            SyncService.syncAccount({
                address,
                privateKey: linkedPrivateKey,
            });
        }

        return user;
    },
    login: async ({ password, address }) => {
        const keyStore = await get('keyStore');
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, pwDerivedKey);

        if (!k.isDerivedKeyCorrect(pwDerivedKey)) {
            throw permissionError('account.incorrect.password');
        }

        const { session } = await set({
            session: {
                lastActive: Date.now(),
                createdAt: Date.now(),
                address,
                pwDerivedKey: JSON.stringify(pwDerivedKey),
            },
        });

        return session;
    },
    enableAssetForDomain,
};

export default AuthService;
