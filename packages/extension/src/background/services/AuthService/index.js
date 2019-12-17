import domainModel from '~/database/models/domain';
import userModel from '~/database/models/user';
import {
    get,
    set,
    remove,
} from '~/utils/storage';
import {
    KeyStore,
} from '~/utils/keyvault';
import {
    permissionError,
} from '~/utils/error';
import enableAssetForDomain from './enableAssetForDomain';

const AuthService = {
    getKeyStore: async () => get('keyStore') || null,
    getSession: async () => {
        const session = await get('session');
        if (!session) {
            return null;
        }
        const {
            pwDerivedKey,
        } = session || {};

        if (!pwDerivedKey) {
            return null;
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

        return user && user.blockNumber
            ? user
            : null;
    },
    getCurrentUser: async () => {
        const {
            address,
        } = await get('session') || {};
        if (!address) {
            return null;
        }

        return {
            address,
        };
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

        const {
            pwDerivedKey,
        } = session;

        return {
            ...session,
            pwDerivedKey: pwDerivedKey
                ? new Uint8Array(Object.values(JSON.parse(pwDerivedKey)))
                : '',
        };
    },
    registerExtension: async ({
        keyStore,
        pwDerivedKey,
    }) => {
        await set({
            keyStore,
            session: {
                pwDerivedKey: JSON.stringify(pwDerivedKey),
                lastActive: Date.now(),
                createdAt: Date.now(),
            },
        });

        return {
            keyStore,
            pwDerivedKey,
        };
    },
    registerAddress: async ({
        address,
        linkedPublicKey,
        spendingPublicKey,
        blockNumber,
    }) => {
        let user = await userModel.get({
            address,
        });
        const userExists = !!user;
        if (!user
            || user.linkedPublicKey !== linkedPublicKey
            || user.spendingPublicKey !== spendingPublicKey
            || user.blockNumber !== blockNumber
        ) {
            user = {
                ...user,
                address,
                linkedPublicKey,
                spendingPublicKey,
                blockNumber,
            };

            if (!userExists) {
                await userModel.set(user);
            } else {
                await userModel.update(user);
            }

            const prevSession = await get('session');
            await set({
                session: {
                    ...prevSession,
                    lastActive: Date.now(),
                    address,
                },
            });
        }

        return user;
    },
    registerDomain: async (domainName) => {
        await domainModel.set(
            {
                domain: domainName,
            },
            {
                ignoreDuplicate: true,
            },
        );

        return domainModel.get({ domain: domainName });
    },
    logout: async () => {
        // TODO - clear data
        await remove('session');

        return true;
    },
    login: async ({ password, address }) => {
        const keyStore = await get('keyStore') || {};
        let pwDerivedKey;
        try {
            ({
                pwDerivedKey,
            } = await KeyStore.generateDerivedKey({
                password,
                salt: keyStore.salt,
            }));

            KeyStore.deserialize(keyStore, pwDerivedKey);
        } catch {
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
