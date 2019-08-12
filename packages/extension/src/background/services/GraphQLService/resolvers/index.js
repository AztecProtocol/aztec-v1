import BigInt from 'apollo-type-bigint';
import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import {
    fromCode,
} from '~utils/noteStatus';
import AuthService from '~background/services/AuthService';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import {
    ensureKeyvault,
    ensureAccount,
    ensureUserPermission,
    ensureEntityPermission,
} from '../decorators';
import getUserSpendingPublicKey from './getUserSpendingPublicKey';
import getAccounts from './getAccounts';
import decryptViewingKey from './decryptViewingKey';
import getAssetBalance from './getAssetBalance';
import requestGrantAccess from './requestGrantAccess';
import pickNotesFromBalance from './pickNotesFromBalance';
import syncAssetInfo from './syncAssetInfo';
import syncNoteInfo from './syncNoteInfo';

export default {
    BigInt: new BigInt('safe'),
    User: {
        spendingPublicKey: async () => getUserSpendingPublicKey(),
    },
    Note: {
        asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ key: asset })) || asset,
        owner: async ({ owner }) => (typeof owner === 'string' && accountModel.get({ key: owner })) || owner,
        decryptedViewingKey: async ({ viewingKey, owner }) => decryptViewingKey(viewingKey, owner),
        status: ({ status }) => fromCode(status),
    },
    Asset: {
        balance: async ({ address }) => getAssetBalance(address),
    },
    GrantNoteAccessPermission: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Query: {
        user: ensureUserPermission(async (_, args) => ({
            account: await userModel.get({
                id: (args.id || args.currentAddress).toLowerCase(),
            }),
        })),
        asset: ensureEntityPermission(async (_, args) => ({
            asset: await syncAssetInfo(args.id),
        })),
        note: ensureEntityPermission(async (_, args, ctx) => ({
            note: await syncNoteInfo(args.id, ctx),
        })),
        grantNoteAccessPermission: ensureEntityPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
        pickNotesFromBalance: ensureEntityPermission(async (_, args, ctx) => ({
            notes: await pickNotesFromBalance(args, ctx),
        })),
        account: ensureUserPermission(async (_, args) => ({
            account: await userModel.get({ address: args.currentAddress }),
        })),
        accounts: ensureUserPermission(async (_, args) => ({
            accounts: await getAccounts(args),
        })),
        subscribe: ensureEntityPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
        userPermission: ensureAccount(async (_, args) => ({
            account: await userModel.get({ address: args.currentAddress }),
        })),
    },
    Mutation: {
        registerExtension: async (_, args) => ({
            account: await AuthService.registerExtension(args),
        }),
        registerAddress: ensureKeyvault(async (_, args) => ({
            account: await AuthService.registerAddress({
                address: args.address,
                linkedPublicKey: args.linkedPublicKey,
                registeredAt: args.registeredAt,
            }),
        })),
        login: ensureAccount(async (_, args) => ({
            session: await AuthService.login(args),
        })),
        approveAssetForDomain: ensureAccount(async (_, args) => {
            await AuthService.enableAssetForDomain(args);
            return {
                asset: await assetModel.get({
                    address: args.asset,
                }),
            };
        }),
    },
};
