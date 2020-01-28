import {
    PriorityQueue,
} from '~/utils/dataStructures';
import EventListeners from '~/utils/EventListeners';

const defaultCapacity = 2 ** 10;

export default class CacheManager {
    constructor(capacity = defaultCapacity) {
        this.priorityQueue = new PriorityQueue();
        this.cache = {};
        this.capacity = capacity;

        this.eventListeners = new EventListeners(['priority']);
    }

    isFull() {
        return this.priorityQueue.size === this.capacity;
    }

    increasePriority(key) {
        const prevPriority = this.priorityQueue.getPriority(key);
        if (prevPriority < 0) return;

        const newPriority = this.priorityQueue.increasePriority(key);
        if (newPriority !== prevPriority) {
            this.eventListeners.notify('priority', this.priorityQueue);
        }
    }

    moveToTop(key) {
        if (!this.has(key)) return;

        const prevTop = this.priorityQueue.getTop();
        if (prevTop === key) return;

        this.priorityQueue.moveToTop(key);
        this.eventListeners.notify('priority', this.priorityQueue);
    }

    add(key, value) {
        if (value === undefined) {
            this.remove(key);
            return;
        }
        if (!(key in this.cache)) {
            if (this.isFull()) {
                const toDelete = this.priorityQueue.removeBottom();
                delete this.cache[toDelete];
            }
            this.priorityQueue.addToTop(key);
            this.eventListeners.notify('priority', this.priorityQueue);
        }
        this.cache[key] = value;
    }

    has(key) {
        return this.cache[key] !== undefined;
    }

    get(key) {
        return this.cache[key];
    }

    getTop() {
        return this.priorityQueue.getTop();
    }

    getBottom() {
        return this.priorityQueue.getBottom();
    }

    remove(key) {
        const data = this.cache[key];

        if (data !== undefined) {
            delete this.cache[key];
            this.priorityQueue.remove(key);
            this.eventListeners.notify('priority', this.priorityQueue);
        }

        return data;
    }
}
