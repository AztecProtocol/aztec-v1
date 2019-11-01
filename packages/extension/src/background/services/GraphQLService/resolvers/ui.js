import AuthService from '~background/services/AuthService';
import EventService from '~background/services/EventService';
import {
    get,
} from '~utils/storage';
import {
    ensureKeyvault,
    ensureAccount,
    ensureDomainPermission,
} from '../decorators';
import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import mergeResolvers from './utils/mergeResolvers';
import ConnectionService from '~ui/services/ConnectionService';
import filterStream from '~utils/filterStream';
import { randomId } from '~utils/random';
import Web3Service from '~helpers/NetworkService';
import base from './base';
import syncNoteInfo from './utils/syncNoteInfo';

const uiResolvers = {
    // Asset: {
    // TODO use RXJS connection
    // balance: async (_, args, ctx, info) => {
    //     // const requestId = randomId();
    //     // ClientConnection.backgroundPort.postMessage({
    //     //     requestId,
    //     //     type: 'UI_QUERY_REQUEST',
    //     //     domain: window.location.orgin,
    //     //     data: {
    //     //         ...info,
    //     //     },
    //     // });
    //     // const response = await filterStream('UI_QUERY_RESPONSE', requestId, ClientConnection.background$);
    //     // return response.balance;
    // },
    // },
    Account: {
        linkedPublicKey: async ({ address }) => {
            const web3Service = await Web3Service();

            return web3Service.useContract('AZTECAccountRegistry')
                .method('accountMapping')
                .call(address);
        },
    },
    Query: {
        user: async (_, { id }) => userModel.get({
            id,
        }),
        asset: async (_, { id }) => assetModel.get({
            address: id,
        }),
        account: async (_, { address }, ctx, info) => {
            const networkId = await get('networkId');
            return EventService.fetchAztecAccount({ address, networkId });
        },


        note: async (_, args) => {
            const {
                note: noteResponse,
                error,
            } = await ConnectionService.query({
                query: 'note',
                data: {
                    ...args,
                },
            });
            return noteResponse.note;
        },
    },
    Mutation: {
        registerExtension: async (_, args) => ({
            account: await AuthService.registerExtension(args),
        }),
        registerAddress: ensureAccount(async (_, args) => ({
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
