import BigInt from 'apollo-type-bigint';
import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import {
    fromCode,
} from '~utils/noteStatus';
import {
    ensureDomainPermission,
} from '../decorators';
import getUserSpendingPublicKey from './utils/getUserSpendingPublicKey';
import getAccounts from './utils/getAccounts';
import decryptViewingKey from './utils/decryptViewingKey';
import getViewingKeyFromMetadata from './utils/getViewingKeyFromMetadata';
import getDecryptedViewingKeyFromMetadata from './utils/getDecryptedViewingKeyFromMetadata'; import getAssetBalance from './utils/getAssetBalance';
import requestGrantAccess from './utils/requestGrantAccess';
import pickNotesFromBalance from './utils/pickNotesFromBalance';
import syncAssetInfo from './utils/syncAssetInfo';
import syncNoteInfo from './utils/syncNoteInfo';
import syncUtilityNoteInfo from './utils/syncUtilityNoteInfo';

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
    UtilityNote: {
        asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ id: asset })) || asset,
        viewingKey: async ({ metadata }) => getViewingKeyFromMetadata(metadata),
        decryptedViewingKey: async ({ metadata }) => getDecryptedViewingKeyFromMetadata(metadata),
    },
    Asset: {
        balance: async ({ address }) => getAssetBalance(address),
    },
    GrantNoteAccessPermission: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Query: {
        user: ensureDomainPermission(async (_, args, ...rest) => ({
            account: await userModel.get({
                id: (args.id || args.currentAddress).toLowerCase(),
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
    },
    Mutation: {},
};
