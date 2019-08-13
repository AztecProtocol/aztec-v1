import BigInt from 'apollo-type-bigint';
import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import {
    fromCode,
} from '~utils/noteStatus';
import {
    ensureUserPermission,
    ensureEntityPermission,
} from '../decorators';
import getUserSpendingPublicKey from './utils/getUserSpendingPublicKey';
import getAccounts from './utils/getAccounts';
import decryptViewingKey from './utils/decryptViewingKey';
import getAssetBalance from './utils/getAssetBalance';
import requestGrantAccess from './utils/requestGrantAccess';
import pickNotesFromBalance from './utils/pickNotesFromBalance';
import syncAssetInfo from './utils/syncAssetInfo';
import syncNoteInfo from './utils/syncNoteInfo';

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
    },
    Mutation: {},
};
