import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import userModel from '~database/models/user';
import {
    ensureKeyvault, // TODO rename this also checks session
    ensureDomainPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import syncUserInfo from './utils/syncUserInfo';
import getAccounts from './utils/getAccounts';
import requestGrantAccess from './utils/requestGrantAccess';
import pickNotesFromBalance from './utils/pickNotesFromBalance';
import syncAssetInfo from './utils/syncAssetInfo';
import syncNoteInfo from './utils/syncNoteInfo';
import syncUtilityNoteInfo from './utils/syncUtilityNoteInfo';
import base from './base';

const backgroundResolvers = {
    Query: {
        user: ensureDomainPermission(async (_, args) => ({
            account: await userModel.get({
                id: (args.id || args.currentAddress),
            }),
        })),
        asset: ensureDomainPermission(async (_, args) => ({
            asset: await syncAssetInfo(args),
        })),
        note: ensureDomainPermission(async (_, args, ctx) => ({
            note: await syncNoteInfo(args, ctx),
        })),
        utilityNote: ensureDomainPermission(async (_, args, ctx) => ({
            note: await syncUtilityNoteInfo(args, ctx),
        })),
        utilityNotes: {
            asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ id: asset })) || asset,
            viewingKey: async ({ metadata }) => getViewingKeyFromMetadata(metadata),
            decryptedViewingKey: async ({ metadata }) => getDecryptedViewingKeyFromMetadata(metadata),
        },
        grantNoteAccessPermission: ensureDomainPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
        pickNotesFromBalance: ensureDomainPermission(async (_, args, ctx) => ({
            notes: await pickNotesFromBalance(args, ctx),
        })),
        account: ensureDomainPermission(async (_, args) => ({
            account: await userModel.get({ address: args.currentAddress }),
        })),
        accounts: ensureDomainPermission(async (_, args) => ({
            accounts: await getAccounts(args),
        })),
        subscribe: ensureDomainPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
        userPermission: ensureKeyvault(async (_, args, ctx) => ({
            account: await syncUserInfo(args, ctx),
        })),
    },
};

export default mergeResolvers(
    base,
    backgroundResolvers,
);
