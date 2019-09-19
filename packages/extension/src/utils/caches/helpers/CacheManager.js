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
        const idx = this.priorityQueue.indexOf(key);
        const nextKey = this.priorityQueue[idx + 1];
        if (idx >= 0 && nextKey) {
            this.priorityQueue.splice(idx, 2, nextKey, key);
        }
    }

    highestPriority(key) {
        const idx = this.priorityQueue.indexOf(key);
        if (idx >= 0
            && idx !== this.priorityQueue.length - 1
        ) {
            this.priorityQueue.splice(idx, 1);
            this.priorityQueue.push(key);
        }
    }

    add(key, value) {
        if (value === undefined) {
            this.remove(key);
            return;
        }
        if (!(key in this.cache)) {
            if (this.priorityQueue.length === this.capacity) {
                const toDelete = this.priorityQueue.shift();
                delete this.cache[toDelete];
            }
            this.priorityQueue.push(key);
        }
        this.cache[key] = value;
    }

    get(key) {
        return this.cache[key];
    }

    getTop() {
        return this.priorityQueue[this.priorityQueue.length - 1];
    }

    remove(key) {
        delete this.cache[key];
        const idx = this.priorityQueue.indexOf(key);
        if (idx >= 0) {
            this.priorityQueue.splice(idx, 1);
        }
    }
}
