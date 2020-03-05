import ClientSubscriptionService from '~/background/services/ClientSubscriptionService';
import {
    ensureKeyvault, // TODO rename this also checks session
    ensureDomainPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import syncUserInfo from './utils/syncUserInfo';
import getAccounts from './utils/getAccounts';
import fetchAsset from './utils/fetchAsset';
import fetchAztecAccount from './utils/fetchAztecAccount';
import pickNotesFromBalance from './utils/pickNotesFromBalance';
import fetchNotesFromBalance from './utils/fetchNotesFromBalance';
import syncNoteInfo from './utils/syncNoteInfo';
import base from './base';

const backgroundResolvers = {
    Query: {
        user: ensureDomainPermission(async (_, args) => fetchAztecAccount({
            address: args.address || args.id,
        })),
        users: ensureDomainPermission(async (_, args, ctx) => ({
            accounts: await getAccounts(args, ctx),
        })),
        asset: ensureDomainPermission(async (_, args) => fetchAsset({
            address: args.id || args.address,
        })),
        note: ensureDomainPermission(async (_, args, ctx) => ({
            note: await syncNoteInfo(args, ctx),
        })),
        pickNotesFromBalance: ensureDomainPermission(async (_, args) => ({
            notes: await pickNotesFromBalance(args),
        })),
        fetchNotesFromBalance: ensureDomainPermission(async (_, args) => ({
            notes: await fetchNotesFromBalance(args),
        })),
        account: ensureDomainPermission(async (_, args) => fetchAztecAccount({
            address: args.currentAddress,
        })),
        accounts: ensureDomainPermission(async (_, args, ctx) => ({
            accounts: await getAccounts(args, ctx),
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
