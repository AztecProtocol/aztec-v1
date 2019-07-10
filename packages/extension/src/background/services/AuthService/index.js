import domainModel from '~database/models/domain';
import { get, set, remove } from '~utils/storage';
import { KeyStore } from '~utils/keyvault/index.js';
import sessionStorage from '../StorageService/sessionStorage';

export default {
    validate: async ({ domain, asset }) => {
        if (!domain) {
            throw new Error('Domain is not present for the query ');
        }

        if (!asset) {
            throw new Error('Asset id is not present for the query ');
        }

        // we check the particular host has access
        // the extension session has a host chrome://extension/id 
        const now = Date.now();
        const session  = get('session');

        if (session.createdAt < now - 60 * 60 * 24 * 21) {
            // remove session not pwkey
            await remove('session');
            throw new Error('The session is > 21 days old please login');
        }

        // the host has not been active in two days
        //
        if (session.lastActive < now - 60 * 60 * 24 * 7) {
            await remove('session');
            throw new Error('The session is no longer active please login');
        }

        // we can now fetch the pwDerivedKey
        const { keyStore } = await get(['keyStore', 'pwDerivedKey']);
        const k = KeyStore.deserialize(keyStore, new Uint8Array(session.pwDerivedKey));

        if (!k.isDerivedKeyCorrect(new Uint8Array(session.pwDerivedKey))) {
            throw new Error('pwDerivedKey should be correct');
        }
        
        try {

            const { assets = {} } = await domainModel.get({
                domain,
            });
            // check if the user has granted the domain access to the given asset
            const { [asset]:isApproved } = assets;

            if (!isApproved) {
                throw new Error(`The user has not granted the domain "${domain}" access`);
            }
        }
        catch(e) {

            throw new Error(`The user has not granted the domain "${domain}" access`);
        }


        await domainModel.set(domain, {
            lastActive: now,
        });

        return {
            session,
            KeyStore: k,
        };
         
    },
    login: sessionStorage.login,
    enableAssetForDomain: async ({
        domain,
        graphQLServer,
        asset
    }) => {
        // the session has already been validated at this point so we can freely write to the db
        // graphnode server is not needd and should be configured via config.

        let {
            data,
            ...rest
        } = await domainModel.update(
            {
                domain,
                graphQLServer,
                assets: {
                    [asset]: true
                }
            },
        );


        const {
            graphQLServer: prevGraphQLServer,
        } = data;
        if (graphQLServer !== prevGraphQLServer) {
            ({
                data,
            } = await domainModel.update({
                domain,
                graphQLServer,
            }));
        }

        return data.domain[domain];

            
    }
};
