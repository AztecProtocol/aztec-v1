import domainModel from '~database/models/domain';
import { get, set, remove } from '~utils/storage';
import { KeyStore } from '~utils/keyvault';
import generateRandomId from '~utils/generateRandomId';


export default {
    validateDomainAccess: async ({ domain, asset }) => {
        if (!domain) {
            throw new Error('Domain is not present for the query ');
        }

        if (!asset) {
            throw new Error('Asset id is not present for the query ');
        }

        try {
            const { assets = {} } = await domainModel.get({
                domain,
            });
            // check if the user has granted the domain access to the given asset
            const {
                [asset]: isApproved,
            } = assets;

            if (!isApproved) {
                throw new Error(`The user has not granted the domain "${domain}" access`);
            }

            return {
                domain,
                assets,
            };
        } catch (e) {
            throw new Error(`The user has not granted the domain "${domain}" access`);
        }
    },
    validateSession: async () => {
        // we check the particular host has access
        const now = Date.now();
        const {
            session,
            keyStore,
        } = await get(['session', 'keyStore']);
        if (!keyStore) {
            throw new Error('AZTEC extension not setup please create account');
        }

        if (!session) {
            throw new Error('No session please login');
        }

        if (session.createdAt < now - 60 * 60 * 24 * 21) {
            // remove session not pwkey
            await remove('session');
            throw new Error('The session is > 21 days old please login');
        }

        // the host has not been active in two days
        if (session.lastActive < now - 60 * 60 * 24 * 7) {
            await remove('session');
            throw new Error('The session is no longer active please login');
        }

        // we can now fetch the pwDerivedKey
        const decodedKey = new Uint8Array(Object.values(JSON.parse(session.pwDerivedKey)));
        const k = KeyStore.deserialize(keyStore, decodedKey);

        if (!k.isDerivedKeyCorrect(decodedKey)) {
            throw new Error('pwDerivedKey should be correct');
        }

        await set({
            session: {
                ...session,
                lastActive: now,
            },
        });

        return session;
    },
    login: async ({ password }) => {
        const { keyStore } = await get(['keyStore']);
        const { pwDerivedKey } = await KeyStore.generateDerivedKey({
            password,
            salt: keyStore.salt,
        });

        const k = KeyStore.deserialize(keyStore, pwDerivedKey);

        if (!k.isDerivedKeyCorrect(pwDerivedKey)) {
            throw new Error('pwDerivedKey should be correct');
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
    enableAssetForDomain: async ({
        domain,
        asset,
    }) => {
        // the session has already been validated at this point so we can freely write to the db
        // graphnode server is not needd and should be configured via config.
        const {
            data,
            modified,
        } = await domainModel.set(
            {
                domain,
                assets: {
                    [asset]: true,
                },
            },
            {
                ignoreDuplicate: true,
            },
        );
        if (!modified.length) {
            const {
                domain: {
                    [domain]: {
                        assets: prevAssets,
                    },
                },
            } = data;

            const {
                data: updatedData,
            } = await domainModel.update({
                domain,
                assets: {
                    ...prevAssets,
                    [asset]: true,
                },
            });

            return updatedData.domain[domain];
        }

        return data.domain[domain];
    },
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
};
