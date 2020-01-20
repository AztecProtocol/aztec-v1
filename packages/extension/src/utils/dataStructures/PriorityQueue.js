export default class PriorityQueue {
    constructor(defaultPriority = []) {
        // item with higher priority is at the back of the queue
        // since processing the tail of an array (pop / push) is faster
        // than processing the head (shift / unshift)
        this.queue = [...defaultPriority].reverse();
        this.size = defaultPriority.length;
    }

    export() {
        return [...this.queue].reverse();
    }

    has(value) {
        return this.queue.indexOf(value) >= 0;
    }

    getTop() {
        return this.queue[this.queue.length - 1];
    }

    getBottom() {
        return this.queue[0];
    }

    getPriority(value) {
        const idx = this.queue.indexOf(value);
        if (idx < 0) {
            return idx;
        }
        return this.queue.length - idx - 1;
    }

    increasePriority(value) {
        let idx = this.queue.indexOf(value);
        if (idx < 0) {
            return idx;
        }

        const nextKey = this.queue[idx + 1];
        if (idx >= 0 && nextKey) {
            this.queue.splice(idx, 2, nextKey, value);
            idx += 1;
        }

        return this.queue.length - idx - 1;
    }

    moveTo(value, priority) {
        const idx = this.queue.indexOf(value);
        if (idx < 0) return;

        const newIdx = this.queue.length - priority - 1;
        if (newIdx === idx) return;

        this.queue.splice(idx, 1);
        // TODO
        // this.queue.splice(newIdx, );
    }

    moveToTop(value) {
        const idx = this.queue.indexOf(value);
        if (idx >= 0
            && idx !== this.queue.length - 1
        ) {
            this.queue.splice(idx, 1);
            this.queue.push(value);
        }
    }

    moveToBottom(value) {
        const idx = this.queue.indexOf(value);
        if (idx >= 0
            && idx !== this.queue.length - 1
        ) {
            this.queue.splice(idx, 1);
            this.queue.push(value);
        }
    }

    addToTop(value) {
        this.size += 1;
        this.queue.push(value);
    }

    addToBottom(value) {
        this.size += 1;
        this.queue.unshift(value);
    }

    remove(value) {
        let removed;
        const idx = this.queue.indexOf(value);
        if (idx >= 0) {
            this.size -= 1;
            removed = this.queue.splice(idx, 1);
        }

        return removed;
    }

    removeTop(count = 1) {
        this.size -= Math.min(count, this.size);
        if (count === 1) {
            return this.queue.pop();
        }

        return this.queue.splice(this.queue.length - count, count);
    }

    removeBottom(count = 1) {
        this.size -= Math.min(count, this.size);
        if (count === 1) {
            return this.queue.shift();
        }

        return this.queue.splice(0, count);
    }
}
