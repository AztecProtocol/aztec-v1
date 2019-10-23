import {
    warnLog,
} from '~utils/log';
import {
    PriorityQueue,
} from '~utils/dataStructures';

const defaultCapacity = 2 ** 10;

export default class CacheManager {
    constructor(capacity = defaultCapacity) {
        this.priorityQueue = new PriorityQueue();
        this.cache = {};
        this.capacity = capacity;

        this.eventListeners = {
            priority: [],
        };
    }

    addListener(eventName, cb) {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call CacheManager.addListener('${eventName}').`,
                `Available events: [${events}].`,
            );
            return;
        }

        this.eventListeners[eventName].push(cb);
    }

    removeListener(eventName, cb) {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call CacheManager.removeListener('${eventName}').`,
                `Available events: [${events}].`,
            );
            return;
        }

        const toRemove = this.eventListeners[eventName]
            .findIndex(listener => listener === cb);
        if (toRemove >= 0) {
            this.eventListeners[eventName].splice(toRemove, 1);
        }
    }

    notifyListeners(eventName, params) {
        const listeners = this.eventListeners[eventName];
        listeners.forEach(cb => cb(params));
    }

    isFull() {
        return this.priorityQueue.size === this.capacity;
    }

    increasePriority(key) {
        const prevPriority = this.priorityQueue.getPriority(key);
        if (prevPriority < 0) return;

        const newPriority = this.priorityQueue.increasePriority(key);
        if (newPriority !== prevPriority) {
            this.notifyListeners('priority', this.priorityQueue);
        }
    }

    moveToTop(key) {
        if (!this.has(key)) return;

        const prevTop = this.priorityQueue.getTop();
        if (prevTop === key) return;

        this.priorityQueue.moveToTop(key);
        this.notifyListeners('priority', this.priorityQueue);
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
            this.notifyListeners('priority', this.priorityQueue);
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
            this.notifyListeners('priority', this.priorityQueue);
        }

        return data;
    }
}
