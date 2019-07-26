import domainModel from '~database/models/domain';
import userModel from '~database/models/user';
import { get, set, remove } from '~utils/storage';
import { KeyStore } from '~utils/keyvault';
import generateRandomId from '~utils/generateRandomId';
import {
    permissionError,
} from '~utils/error';
import {
    errorLog,
} from '~utils/log';
import SyncService from '../SyncService';
import enableAssetForDomain from './enableAssetForDomain';

export default {
    validateUserAddress: async (address) => {
        if (!address) { // this shouldn't happend in production
            errorLog('Address cannot be empty in AuthService.validateUserAddress()');
            return null;
        }

        const user = await userModel.get({
            address: address.toLowerCase(),
        });
        if (!user) {
            return permissionError('account.not.register', {
                messageOptions: {
                    account: address,
                },
            });
        }

        return {
            user,
        };
    },
    validateExtension: async () => {
        const keyStore = await get('keyStore');
        if (!keyStore) {
            return permissionError('extension.not.registered', {
                messageOptions: {},
            });
        }
        return {};
    },
    validateDomain: async (domain) => {
        const registeredDomain = await domainModel.get({
            domain,
        });
        if (!registeredDomain) {
            return permissionError('domain.not.register', {
                messageOptions: {
                    domain,
                },
            });
        }

        return {
            domain: registeredDomain,
        };
    },
    validateDomainAccess: async ({
        domain,
        assetId,
        noteId,
    }) => {
        const {
            assets: {
                [assetId]: isApproved,
            } = {},
        } = await domainModel.get({
            domain,
        }) || {};

        if (!isApproved) {
            if (noteId) {
                return permissionError('domain.not.grantedAccess.note', {
                    messageOptions: {
                        domain,
                        note: noteId,
                        asset: assetId,
                    },
                });
            }
            return permissionError('domain.not.grantedAccess.asset', {
                messageOptions: {
                    domain,
                    asset: assetId,
                },
            });
        }

        return {
            domain,
        };
    },
    validateSession: async () => {
        // we check the particular host has access
        const now = Date.now();
        const {
            session,
            keyStore,
        } = await get(['session', 'keyStore']);
        if (!keyStore) {
            return permissionError('extension.not.registered', {
                messageOptions: {},
            });
        }

        if (!session) {
            return permissionError('account.not.login', {
                messageOptions: {},
            });
        }

        if (session.createdAt < now - 60 * 60 * 24 * 21 * 1000) {
            // remove session not pwkey
            await remove('session');

            return permissionError('account.not.login', {
                messageOptions: {},
            });
            // throw new Error('The session is > 21 days old please login');
        }

        // the host has not been active in two days
        if (session.lastActive < now - 60 * 60 * 24 * 7 * 1000) {
            await remove('session');
            return permissionError('account.not.login', {
                messageOptions: {},
            });
        }

        // we can now fetch the pwDerivedKey
        const decodedKey = new Uint8Array(Object.values(JSON.parse(session.pwDerivedKey)));
        const k = KeyStore.deserialize(keyStore, decodedKey);

        if (!k.isDerivedKeyCorrect(decodedKey)) {
            return permissionError('account.incorrect.password', {
                messageOptions: {},
            });
        }

        await set({
            session: {
                ...session,
                lastActive: now,
            },
        });

        return {
            session: {
                ...session,
                pwDerivedKey: decodedKey,
            },
            keyStore: k,
        };
    },
    login: async ({ password }) => {
        const { keyStore } = await get(['keyStore']);
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, pwDerivedKey);

        if (!k.isDerivedKeyCorrect(pwDerivedKey)) {
            return permissionError('account.incorrect.password', {
                messageOptions: {},
            });
        }

        const { session } = await set({
            session: {
                lastActive: Date.now(),
                createdAt: Date.now(),
                pwDerivedKey: JSON.stringify(pwDerivedKey),
            },
        });

        return session;
    },
    enableAssetForDomain,
    registerExtension: async ({ password, salt }) => {
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt,
        });
        const mnemonic = KeyStore.generateRandomSeed(generateRandomId());

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
            },
        });

        return {
            publicKey: keyStore.privacyKeys.publicKey,
        };
    },
    registerAddress: async ({
        userAddress,
        linkedPublicKey,
    }) => {
        if (!userAddress) { // this shouldn't happend in production
            errorLog('Address cannot be empty in AuthService.registerAddress()');
            return null;
        }
        if (!linkedPublicKey) { // this shouldn't happend in production
            errorLog('linkedPublicKey cannot be empty in AuthService.registerAddress()');
            return null;
        }

        const address = userAddress.toLowerCase();
        let user = await userModel.get({
            address,
        });

        if (!user) {
            user = {
                address,
                linkedPublicKey,
            };

            await userModel.set(user);
            SyncService.syncAccount(address);
        }

        return user;
    },
};
