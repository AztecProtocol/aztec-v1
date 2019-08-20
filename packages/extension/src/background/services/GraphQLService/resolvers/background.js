import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import {
    ensureKeyvault,
    ensureDomainPermission,
} from '../decorators';
import mergeResolvers from './utils/mergeResolvers';
import syncUserInfo from './utils/syncUserInfo';
import base from './base';

const backgroundResolvers = {
    Query: {
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
