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

    isFull() {
        return this.priorityQueue.length === this.capacity;
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
            if (this.isFull()) {
                const toDelete = this.priorityQueue.shift();
                delete this.cache[toDelete];
            }
            this.priorityQueue.push(key);
        }
        this.cache[key] = value;
    }

    has(key) {
        return !!this.cache[key];
    }

    get(key) {
        return this.cache[key];
    }

    getTop() {
        return this.priorityQueue[this.priorityQueue.length - 1];
    }

    getBottom() {
        return this.priorityQueue[0];
    }

    remove(key) {
        const data = this.cache[key];
        delete this.cache[key];
        const idx = this.priorityQueue.indexOf(key);
        if (idx >= 0) {
            this.priorityQueue.splice(idx, 1);
        }
        return data;
    }
}
