class SubscriptionManager {
    constructor() {
        this.subscriptions = {
            /*
             * [subscriptionType]: {
             *      [id]: Set(Subscriber!)
             * }
             */
            ASSET_BALANCE: {},
        };

        this.validRequests = {
            /*
             * [requestId]: {
             *      type: subscriptionType!
             *      id
             * }
             */
        };
    }

    isValidType(type) {
        return !!this.subscriptions[type];
    }

    isValidRequest(requestId) {
        return !!this.validRequests[requestId];
    }

    getSubscribers(type, id) {
        return this.subscriptions[type][id] || [];
    }

    grantSubscription({
        requestId,
        type,
        id,
    }) {
        this.validRequests[requestId] = {
            type,
            id,
        };
    }

    addSubscriber(subscriber, requestId) {
        const {
            type,
            id,
        } = this.validRequests[requestId];

        if (!this.subscriptions[type][id]) {
            this.subscriptions[type][id] = new Set();
        }

        this.subscriptions[type][id].add(subscriber);
    }

    removeSubscribers(subscriber, requestId) {
        const {
            type,
            id,
        } = this.validRequests[requestId];

        if (this.subscriptions[type][id]) {
            this.subscriptions[type][id].delete(subscriber);
        }

        delete this.validRequests[requestId];
    }
}

export default new SubscriptionManager();
