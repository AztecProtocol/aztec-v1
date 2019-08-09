import assetModel from '~database/models/asset';
import userModel from '~database/models/user';
import accountModel from '~database/models/account';
import GraphNodeService from '~backgroundServices/GraphNodeService';
import {
    fromCode,
} from '~utils/noteStatus';
import AuthService from '~background/services/AuthService';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import {
    ensureUserPermission,
    ensureEntityPermission,
    ensureKeyvault,
    ensureAccount,
} from '../decorators';
import pipe from '../utils/pipe';
import validateSession from '../validators/validateSession';
import getUserSpendingPublicKey from './getUserSpendingPublicKey';
import getAccounts from './getAccounts';
import decryptViewingKey from './decryptViewingKey';
import getAssetBalance from './getAssetBalance';
import requestGrantAccess from './requestGrantAccess';
import pickNotesFromBalance from './pickNotesFromBalance';
import syncAssetInfo from './syncAssetInfo';
import syncNoteInfo from './syncNoteInfo';

export default {
    User: {
        spendingPublicKey: async ({ address }) => getUserSpendingPublicKey(address),
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
        account: ensureKeyvault(ensureAccount(async (_, args) => {
            const account = await userModel.get({ address: args.currentAddress });
            if (account && !account.registered) {
                const { account: user } = await GraphNodeService.query(`
                    account(id: "${args.currentAddress.toLowerCase()}") {
                        address
                        linkedPublicKey
                        registered
                    }
                `);

                if (user && user.registered) {
                    await AuthService.registerAddress({
                        address: user.address,
                        linkedPublicKey: user.linkedPublicKey,
                    });
                }
                return {
                    account: user && user.registered ? user : account,
                };
            }
            return {
                account,
            };
        })),
        accounts: ensureUserPermission(async (_, args) => ({
            accounts: await getAccounts(args),
        })),
        subscribe: ensureEntityPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
    },
    Mutation: {
        login: pipe([ensureAccount, async (_, args) => AuthService.login(args)]),
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
