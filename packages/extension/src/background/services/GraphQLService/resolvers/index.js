import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import GraphNodeService from '~backgroundServices/GraphNodeService';
import noteModel from '~database/models/note';
import {
    fromCode,
} from '~utils/noteStatus';
import AuthService from '../../AuthService';
import {
    ensureUserPermission,
    ensureEntityPermission,
    ensureKeyvault,
} from '../decorators';
import pipe from '../utils/pipe';
import validateSession from '../validators/validateSession';
import getUserSpendingPublicKey from './getUserSpendingPublicKey';
import getAccounts from './getAccounts';
import decryptViewingKey from './decryptViewingKey';
import requestGrantAccess from './requestGrantAccess';
import pickNotesFromBalance from './pickNotesFromBalance';
import syncAssetInfo from '../../AuthService/enableAssetForDomain/syncAssetInfo';

export default {
    User: {
        spendingPublicKey: async ({ address }) => getUserSpendingPublicKey(address),
    },
    Note: {
        asset: async ({ asset }) => assetModel.get({ key: asset }),
        owner: async ({ owner }) => accountModel.get({ key: owner }),
        decryptedViewingKey: async ({ viewingKey, owner }) => decryptViewingKey(viewingKey, owner),
        status: ({ status }) => fromCode(status),
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
        note: ensureEntityPermission(async (_, args) => ({
            note: await noteModel.get(args),
        })),
        grantNoteAccessPermission: ensureEntityPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
        pickNotesFromBalance: ensureEntityPermission(async (_, args, ctx) => ({
            notes: await pickNotesFromBalance(args, ctx),
        })),
        account: ensureKeyvault(async (_, args) => {
            const account = await userModel.get({ address: args.currentAddress });
            if (!account.registered) {
                const { account: user } = await GraphNodeService.query(`
                    account(id: "${args.currentAddress.toLowerCase()}") {
                        address
                        linkedPublicKey
                        registered 
                    }
                `);
                if (user) {
                    await AuthService.registerAddress({
                        address: user.address,
                        linkedPublicKey: user.linkedPublicKey,
                    });
                }
                return {
                    account: user || account,
                };
            }
            return {
                account,
            };
        }),
        accounts: ensureUserPermission(async (_, args) => ({
            accounts: await getAccounts(args),
        })),
    },
    Mutation: {
        login: (_, args) => AuthService.login(args),
        // logout: sessionDecorator(AuthService.logout),
        registerExtension: pipe([
            async (_, args) => ({
                account: await AuthService.registerExtension(args),
            })]),
        registerAddress: pipe([
            validateSession,
            async (_, args, ctx) => ({
                account: await AuthService.registerAddress({
                    userAddress: args.address,
                    linkedPublicKey: ctx.keyStore.privacyKeys.publicKey,
                }),
            }),
        ]),
        approveAssetForDomain: pipe([
            validateSession,
            async (_, args) => {
                await AuthService.enableAssetForDomain(args);
                return {
                    asset: await assetModel.get({
                        address: args.asset,
                    }),
                };
            },
        ]),
    },
};
