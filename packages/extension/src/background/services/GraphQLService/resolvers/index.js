import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import userModel from '~database/models/user';
import noteModel from '~database/models/note';
import AuthService from '../../AuthService';
import {
    ensureUserPermission,
    ensureEntityPermission,
    ensureKeyvault,
} from '../decorators';
import pipe from '../utils/pipe';
import validateSession from '../validators/validateSession';
import getUserSpendingPublicKey from './getUserSpendingPublicKey';
import requestGrantAccess from './requestGrantAccess';
import createNoteFromBalance from './createNoteFromBalance';

export default {
    User: {
        spendingPublicKey: async ({ address }) => getUserSpendingPublicKey(address),
    },
    Note: {
        asset: async ({ asset }) => assetModel.get({ key: asset }),
        owner: async ({ owner }) => accountModel.get({ key: owner }),
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
            asset: await assetModel.get(args),
        })),
        note: ensureEntityPermission(async (_, args) => ({
            note: await noteModel.get(args),
        })),
        grantNoteAccessPermission: ensureEntityPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
        createNoteFromBalance: ensureEntityPermission(async (_, args, ctx) => ({
            note: await createNoteFromBalance(args, ctx),
        })),
        account: ensureKeyvault(async (_, args, ctx) => {
            return {
                account: await userModel.get({address: args.currentAddress}),
            };
        })
    },
    Mutation: {
        login: (_, args) => AuthService.login(args),
        // logout: sessionDecorator(AuthService.logout),
        registerExtension: pipe([
            async (_, args) => ({
                account: await AuthService.registerExtension(args),
            }),
        ]),
        registerAddress: pipe([
            validateSession,
            async (_, args, ctx) => ({
                account: await AuthService.registerAddress({
                    userAddress: args.address,
                    linkedPublicKey: ctx.keyStore.privacyKeys.publicKey,
                }),
            }),
        ]),
        enableAssetForDomain: pipe([
            validateSession,
            async (_, args) => ({
                asset: AuthService.enableAssetForDomain(args),
            }),
        ]),
    },
};
