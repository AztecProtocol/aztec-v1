import {
    randomId,
} from '~/utils/random';
import ConnectionService from '~/client/services/ConnectionService';

export default class SubscriptionManager {
    constructor() {
        this.requestId = randomId();
    }

    add(type, id, subscriber) {
        return ConnectionService.subscribe(
            this.requestId,
            type,
            id,
            subscriber,
        );
    }

    remove(type, id, subscriber) {
        return ConnectionService.unsubscribe(
            this.requestId,
            type,
            id,
            subscriber,
        );
    }
}
