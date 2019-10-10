import AuthService from '~background/services/AuthService';
import {
    ensureKeyvault,
    ensureAccount,
} from '../decorators';
import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import mergeResolvers from './utils/mergeResolvers';
import filterStream from '~utils/filterStream';
import { randomId } from '~utils/random';
import Web3Service from '~helpers/NetworkService';
import base from './base';
import ClientConnection from '../../../../ui/services/ClientConnectionService';

const uiResolvers = {
    Asset: {
        // TODO use RXJS connection
        balance: async (_, args, ctx, info) => {
            const requestId = randomId();
            ClientConnection.backgroundPort.postMessage({
                requestId,
                type: 'UI_QUERY_REQUEST',
                domain: window.location.orgin,
                data: {
                    ...info,
                },
            });
            const response = await filterStream('UI_QUERY_RESPONSE', requestId, ClientConnection.background$);
            return response.balance;
        },
    },
    Account: {
        linkedPublicKey: async ({ address }) => {
            const web3Service = await Web3Service();

            return web3Service.useContract('AZTECAccountRegistry')
                .method('accountMapping')
                .call(address);
        },
    },
    Note: {
        decryptedViewingKey: async ({ decryptedViewingKey }) => decryptedViewingKey,
    },
    Query: {
        user: async (_, { id }) => userModel.get({
            id,
        }),
        asset: async (_, { id }) => assetModel.get({
            address: id,
        }),
        account: async (_, { address }) => ({
            id: address,
            address,
        }),
    },
    Mutation: {
        registerExtension: async (_, args) => ({
            account: await AuthService.registerExtension(args),
        }),
        registerAddress: ensureKeyvault(async (_, args) => ({
            account: await AuthService.registerAddress({
                address: args.address,
                linkedPublicKey: args.linkedPublicKey,
                spendingPublicKey: args.spendingPublicKey,
                blockNumber: args.blockNumber,
            }),
        })),
        login: ensureAccount(async (_, args) => ({
            session: await AuthService.login(args),
        })),
        registerDomain: ensureAccount(async (_, args) => {
            await AuthService.registerDomain(args.domain);
            return {
                success: true,
            };
        }),
    },
};

export default mergeResolvers(
    base,
    uiResolvers,
);
