import CacheManager from './helpers/CacheManager';

export default class LRUCache {
    constructor(capacity) {
        this.cache = new CacheManager(capacity);
    }

    add(key, value) {
        this.cache.add(key, value);
        this.cache.highestPriority(key);
    }

    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.cache.highestPriority(key);
        }
        return value;
    }

    remove(key) {
        this.cache.remove(key);
    }
}
