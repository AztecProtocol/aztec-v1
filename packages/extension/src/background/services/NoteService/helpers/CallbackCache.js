import CacheManager from '~/utils/caches/helpers/CacheManager';
import {
    defaultMaxCallbacks,
} from '../config';

// TODO - make it a general util
export default class CallbackCache extends CacheManager {
    constructor(maxCallbacks = defaultMaxCallbacks) {
        super(maxCallbacks);
        this.numberOfCallbacks = 0;
        this.maxCallbacks = maxCallbacks;
    }

    add(assetId, cb) {
        const prevCallbacks = this.get(assetId);
        const callbacks = !prevCallbacks
            ? [cb]
            : [
                ...prevCallbacks,
                cb,
            ];
        this.numberOfCallbacks += 1;

        // TODO - remove items in cache when this.numberOfCallbacks exceeds maxCallbacks

        return super.add(assetId, callbacks);
    }

    remove(assetId) {
        const callbacks = super.remove(assetId);
        if (!callbacks) {
            return [];
        }

        this.maxCallbacks -= callbacks.length;
        return callbacks;
    }
}
