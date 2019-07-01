import asyncForEach from '~utils/asyncForEach';

class LockManager {
    constructor() {
        this.lockedKeys = new Set();
        this.queue = new Set();
        this.onFinishedListeners = [];
    }

    isLocked(keys) {
        const toCheck = typeof keys === 'string'
            ? [keys]
            : keys;
        return toCheck.some(key => this.lockedKeys.has(key));
    }

    doLock(keys) {
        if (typeof keys !== 'object') {
            this.lockedKeys.add(keys);
        } else {
            keys.forEach(key => this.lockedKeys.add(key));
        }
    }

    unlock(keys) {
        if (typeof keys !== 'object') {
            this.lockedKeys.delete(keys);
        } else {
            keys.forEach(key => this.lockedKeys.delete(key));
        }
    }

    async waitInQueue({
        keys,
        exec,
    }) {
        return new Promise((resolve) => {
            this.queue.add({
                keys,
                exec,
                resolve,
            });
        });
    }

    async nextInQueue() {
        const next = [...this.queue].find(({
            keys,
        }) => !this.isLocked(keys));

        if (!next) return;

        this.queue.delete(next);

        const {
            keys,
            exec,
            resolve,
        } = next;
        this.doLock(keys);

        const result = await exec();

        this.unlock(keys);

        this.nextInQueue();

        resolve(result);
    }

    lock = async (keys, exec) => {
        if (this.isLocked(keys)) {
            return this.waitInQueue({
                keys,
                exec,
            });
        }

        this.doLock(keys);

        const result = await exec();

        this.unlock(keys);
        this.nextInQueue();

        return result;
    };

    enterIdleMode() {
        const listeners = this.onFinishedListeners;
        this.onFinishedListeners = [];
        asyncForEach(listeners, async ({
            cb,
            resolve,
        }) => {
            let result;
            if (cb) {
                result = await cb();
            }
            resolve(result);
        });
    }

    async idle(cb) {
        if (!this.queue.size) {
            if (cb) {
                return cb();
            }
            return true;
        }

        return new Promise((resolve) => {
            this.onFinishedListeners.push({
                cb,
                resolve,
            });
        });
    }
}

export default LockManager;
