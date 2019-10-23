import CacheManager from './helpers/CacheManager';

export default class LRUCache {
    constructor(capacity) {
        this.cache = new CacheManager(capacity);
    }

    add(key, value) {
        this.cache.add(key, value);
        this.cache.moveToTop(key);
    }

    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.cache.moveToTop(key);
        }
        return value;
    }

    remove(key) {
        this.cache.remove(key);
    }
}
