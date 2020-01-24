import {
    errorLog,
} from '~/utils/log';
import SubscriptionManager from './helpers/SubscriptionManager';

const manager = new SubscriptionManager();

export default {
    reset: () => manager.reset(),
    grantSubscription: (
        {
            clientId,
            type,
            id,
        },
        callback,
    ) => {
        if (!manager.isValidType(type)) {
            errorLog(`Cannot grant subscription of type '${type}'.`);
            return false;
        }

        return manager.grantSubscription({
            clientId,
            type,
            id,
            callback,
        });
    },
    removeSubscription: ({
        clientId,
        type,
        id,
    }, callback) => manager.removeSubscription({
        clientId,
        type,
        id,
        callback,
    }),
    removeAllSubscriptions: clientId => manager.removeAllSubscriptions(clientId),
    notifySubscribers: (type, id, value, forceNotify = false) => {
        if (!manager.isValidType(type)) {
            errorLog(`Cannot notify subscriber of type '${type}'.`);
            return;
        }

        const {
            prevValue,
            subscribers,
        } = manager.getSubscription(type, id) || {};
        if (!subscribers
            || (!forceNotify && value === prevValue)
        ) {
            return;
        }

        manager.updateSubscriptionValue(type, id, value);
        subscribers.forEach(({
            clientId,
            callback,
        }) => {
            callback(value, {
                clientId,
                type,
                id,
            });
        });
    },
};
