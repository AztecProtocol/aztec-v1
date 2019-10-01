import assetModel from '~database/models/asset';
import AuthService from '~background/services/AuthService';
import {
    ensureKeyvault,
    ensureAccount,
    ensureDomainPermission,
} from '../decorators';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import mergeResolvers from './utils/mergeResolvers';
import filterStream from '~utils/filterStream';
import { randomId } from '~utils/random';
import syncUserInfo from './utils/syncUserInfo';
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
    Note: {
        decryptedViewingKey: async ({ decryptedViewingKey }) => decryptedViewingKey,
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
    Query: {
        subscribe: ensureDomainPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
        pickNotesFromBalance: ensureDomainPermission(async (_, args, ctx, info) => {
            const requestId = randomId();
            ClientConnection.backgroundPort.postMessage({
                requestId,
                type: 'UI_QUERY_REQUEST',
                clientId: ClientConnection.clientId,
                data: {
                    query: 'asset.pickNotesFromBalance',
                    args,
                },
                domain: window.location.orgin,
            });

            const {
                data: {
                    response: {
                        pickNotesFromBalance,
                    },
                },
            } = await filterStream('UI_QUERY_RESPONSE', requestId, ClientConnection.background$);
            return {
                notes: pickNotesFromBalance.notes,
            };
        }),
    },
};

export default mergeResolvers(
    base,
    uiResolvers,
);
