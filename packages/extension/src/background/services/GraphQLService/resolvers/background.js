import userModel from '~database/models/user';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import {
    ensureKeyvault,
    ensureDomainPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import base from './base';

const backgroundResolvers = {
    Query: {
        subscribe: ensureDomainPermission(async (_, args) => ({
            success: ClientSubscriptionService.grantSubscription(args),
        })),
            account: await userModel.get({ address: args.currentAddress }),
        userPermission: ensureKeyvault(async (_, args, ctx) => ({
        })),
    },
};

export default mergeResolvers(
    base,
    backgroundResolvers,
);
