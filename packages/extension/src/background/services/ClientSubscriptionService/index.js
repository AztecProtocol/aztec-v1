import {
    errorLog,
} from '~/utils/log';
import manager from './helpers/SubscriptionManager';

export default {
    grantSubscription: ({
        requestId,
        type,
        assetId,
        noteId,
    }) => {
        if (!manager.isValidType(type)) {
            errorLog(`Cannot grant subscription of type '${type}'.`);
            return false;
        }

        manager.grantSubscription({
            requestId,
            type,
            id: assetId || noteId,
        });

        return true;
    },
    subscribe(port) {
        const {
            name: requestId,
        } = port;
        if (!manager.isValidRequest(requestId)) return;

        manager.addSubscriber(port, requestId);
    },
    unsubscribe(port) {
        const {
            name: requestId,
        } = port;
        if (!manager.isValidRequest(requestId)) return;

        manager.removeSubscribers(port, requestId);
    },
    onChange: (type, id, data) => {
        if (!manager.isValidType(type)) {
            errorLog(`Cannot trigger subscription of type '${type}'.`);
            return;
        }

        const subscribers = manager.getSubscribers(type, id);
        subscribers.forEach((port) => {
            if (!port.error) {
                port.postMessage(data);
            }
        });
    },
};
