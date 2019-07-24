import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import noteModel from '~database/models/note';
import AuthService from '../../AuthService';
import {
    ensureEntityPermission,
} from '../decorators';
import pipe from '../utils/pipe';
import validateSession from '../validators/validateSession';
import requestGrantAccess from './requestGrantAccess';

export default {
    Note: {
        asset: async ({ asset }) => assetModel.get({ key: asset }),
        owner: async ({ owner }) => accountModel.get({ key: owner }),
    },
    GrantNoteAccessPermission: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Query: {
        asset: ensureEntityPermission(async (_, args) => ({
            asset: await assetModel.get(args),
        })),
        note: ensureEntityPermission(async (_, args) => ({
            note: await noteModel.get(args),
        })),
        grantNoteAccessPermission: ensureEntityPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
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
            async (_, args) => ({
                account: await AuthService.registerAddress(args.address),
            }),
        ]),
        enableAssetForDomain: pipe([
            validateSession,
            async (_, args) => AuthService.enableAssetForDomain(args),
        ]),
    },
};
