import AuthService from '~background/services/AuthService';
import EventService from '~background/services/EventService';
import {
    get,
} from '~utils/storage';
import {
    ensureAccount,
} from '../decorators';
import userModel from '~database/models/user';
import mergeResolvers from './utils/mergeResolvers';
import ConnectionService from '~ui/services/ConnectionService';
import Web3Service from '~helpers/NetworkService';
import base from './base';

const uiResolvers = {
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
        asset: async (_, { id }) => {
            const {
                asset,
            } = await EventService.fetchAsset({ address: id });
            return asset;
        },
        account: async (_, { address }) => {
            const networkId = await get('networkId');
            return EventService.fetchAztecAccount({ address, networkId });
        },
        note: async (_, args) => {
            const {
                note: noteResponse,
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
