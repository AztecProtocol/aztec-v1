import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import userModel from '~database/models/user';
import {
    ensureKeyvault, // TODO rename this also checks session
    ensureDomainPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import syncUserInfo from './utils/syncUserInfo';
import getAccounts from './utils/getAccounts';
import NoteService from '~background/services/NoteService';
import fetchAsset from './utils/fetchAsset';
import fetchAztecAccount from './utils/fetchAztecAccount';
import requestGrantAccess from './utils/requestGrantAccess';
import pickNotesFromBalance from './utils/pickNotesFromBalance';
import syncNoteInfo from './utils/syncNoteInfo';
import base from './base';

const backgroundResolvers = {
    Query: {
        user: ensureDomainPermission(async (_, args) => ({
            account: await userModel.get({
                id: (args.id || args.currentAddress),
            }),
        })),
        asset: ensureDomainPermission(async (_, args, ctx) => fetchAsset({
            address: args.id || args.address,
            networkId: ctx.networkId,
        })),
        note: ensureDomainPermission(async (_, args, ctx) => ({
            note: await syncNoteInfo(args, ctx),
        })),
        grantNoteAccessPermission: ensureDomainPermission(async (_, args, ctx) => ({
            permission: await requestGrantAccess(args, ctx),
        })),
        pickNotesFromBalance: ensureDomainPermission(async (_, args, ctx) => ({
            notes: await pickNotesFromBalance(args, ctx),
        })),
        fetchNotesFromBalance: ensureDomainPermission(async (_, args, ctx) => ({
            notes: await NoteService.fetch(
                ctx.networkId,
                args.owner,
                args.assetId,
                {
                    equalTo: args.equalTo,
                    greaterThan: args.greaterThan,
                    lessThan: args.lessThan,
                    numberOfNotes: args.numberOfNotes,
                },
            ),
        })),
        account: ensureDomainPermission(async (_, args, ctx) => fetchAztecAccount({
            address: args.currentAddress,
            networkId: ctx.networkId,
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
