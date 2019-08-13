import userModel from '~database/models/user';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import {
    ensureAccount,
    ensureEntityPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import base from './base';

const backgroundResolvers = {
    Query: {
        subscribe: ensureEntityPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
        userPermission: ensureAccount(async (_, args) => ({
            account: await userModel.get({ address: args.currentAddress }),
        })),
    },
};

export default mergeResolvers(
    base,
    backgroundResolvers,
);
