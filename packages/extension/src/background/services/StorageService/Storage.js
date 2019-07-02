class Storage {
    constructor() {
        this.locked = false;
        this.queue = [];
    }

    async waitInQueue({
        method,
        args,
    }) {
        return new Promise((resolve) => {
            this.queue.push({
                method,
                args,
                resolve,
            });
        });
    }

    async nextInQueue() {
        if (!this.queue.length) return;

        const {
            method,
            args,
            resolve,
        } = this.queue.unshift();

        const result = await this[method](...args);
        resolve(result);
    }
}

export default Storage;
