const defaultCapacity = 2 ** 10;

export default class CacheManager {
    constructor(capacity = defaultCapacity) {
        // item with higher priority is at the back of the queue
        // since processing the tail of an array (pop / push) is faster
        // than processing the head (shift / unshift)
        this.priorityQueue = [];
        this.cache = {};
        this.capacity = capacity;
    }

    increasePriority(key) {
        const idx = this.priorityQueue.findIndex(key);
        const nextKey = this.priorityQueue[idx + 1];
        if (idx >= 0 && nextKey) {
            this.priorityQueue.splice(idx, 2, [nextKey, key]);
        }
    }

    highestPriority(key) {
        const idx = this.priorityQueue.findIndex(key);
        if (idx >= 0
            && idx !== this.priorityQueue.length - 1
        ) {
            this.priorityQueue.splice(idx, 1);
            this.priorityQueue.push(key);
        }
    }

    add(key, value) {
        this.cache[key] = value;
        if (this.priorityQueue.length === this.capacity) {
            this.priorityQueue.shift();
        }
        this.priorityQueue.push(key);
    }

    get(key) {
        return this.cache[key];
    }

    remove(key) {
        delete this.cache[key];
        const idx = this.priorityQueue.findIndex(key);
        if (idx >= 0) {
            this.priorityQueue.splice(idx, 1);
        }
    }
}
