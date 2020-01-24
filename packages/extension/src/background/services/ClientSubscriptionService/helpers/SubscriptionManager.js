export default class SubscriptionManager {
    constructor() {
        this.subscriptions = {
            /*
             * [type]: {
             *     [id]: {
             *         prevValue: any
             *         subscribers: [Subscriber!]
             *     }
             * }
             *
             * - Subscriber: {
             *       clientId,
             *       callback,
             *   }
             */
        };
        this.reset();
    }

    reset() {
        this.subscriptions = {
            ASSET_BALANCE: {},
        };
    }

    isValidType(type) {
        return !!this.subscriptions[type];
    }

    getSubscription(type, id) {
        return this.subscriptions[type][id];
    }

    updateSubscriptionValue(type, id, value) {
        this.subscriptions[type][id].prevValue = value;
    }

    grantSubscription({
        clientId,
        type,
        id,
        callback,
        allowDuplicates = false,
    }) {
        if (!this.subscriptions[type][id]) {
            this.subscriptions[type][id] = {
                subscribers: [],
            };
        }

        const hasSubscribed = this.subscriptions[type][id]
            .subscribers
            .some(s => s.clientId === clientId
                && !allowDuplicates
                && s.callback === callback);
        if (!hasSubscribed) {
            this.subscriptions[type][id].subscribers.push({
                clientId,
                callback,
            });
        }

        return true;
    }

    removeSubscription({
        clientId,
        type,
        id,
        callback = null,
    }) {
        if (!this.subscriptions[type][id]
            || !this.subscriptions[type][id]
        ) {
            return null;
        }

        const prevSubscribers = this.subscriptions[type][id].subscribers;
        const removedSubscribers = prevSubscribers
            .filter(s => s.clientId === clientId
                && (!callback || s.callback === callback));
        if (!removedSubscribers.length) {
            return null;
        }

        const restSubscribers = prevSubscribers
            .filter(s => removedSubscribers.indexOf(s) < 0);
        if (restSubscribers.length) {
            this.subscriptions[type][id].subscribers = restSubscribers;
        } else {
            delete this.subscriptions[type][id];
        }

        return removedSubscribers;
    }

    removeAllSubscriptions(clientId) {
        Object.keys(this.subscriptions).forEach((type) => {
            Object.keys(this.subscriptions[type]).forEach((id) => {
                this.removeSubscription({
                    clientId,
                    type,
                    id,
                });
            });
        });
    }
}
