import CacheManager from '~utils/caches/helpers/CacheManager';
import {
    defaultMaxAssets,
    defaultMaxNotes,
} from '../config';
import sizeOfNoteValues from '../utils/sizeOfNoteValues';

export default class NoteBucketCache {
    constructor({
        maxAssets = defaultMaxAssets,
        maxNotes = defaultMaxNotes,
    } = {}) {
        this.maxAssets = maxAssets;
        this.capacity = maxNotes;
        this.memoryUsage = 0;
        this.sizeMapping = {};
        this.cache = new CacheManager(maxAssets);
        /**
         * Data structure in cache:
         *     [assetId]: {
         *         [value]: [NoteKey!],
         *     }
         */
    }

    import({
        assetSummary,
        assetNotes,
        priority,
    }) {
        Object.keys(assetSummary).forEach((assetId) => {
            const {
                size,
            } = assetSummary[assetId];

            this.sizeMapping[assetId] = size;
        });

        let memoryUsage = 0;
        const validAssets = [];
        priority
            .some((assetId) => {
                const size = this.sizeMapping[assetId];

                if (!assetNotes[assetId]
                    || !size
                ) {
                    return false;
                }

                if (validAssets.length > 0
                    && memoryUsage + size > this.capacity
                ) {
                    return true;
                }

                memoryUsage += size;
                validAssets.push(assetId);

                return memoryUsage >= this.capacity
                    || validAssets.length === this.maxAssets;
            });

        validAssets
            .reverse()
            .forEach((assetId) => {
                if (!assetNotes[assetId]) return;
                this.cache.add(assetId, assetNotes[assetId]);
                this.memoryUsage += this.sizeMapping[assetId];
            });
    }

    export() {
        const {
            cache,
            priorityQueue,
        } = this.cache;

        return {
            assetNotes: cache,
            priority: priorityQueue.export(),
        };
    }

    has(assetId) {
        return this.cache.has(assetId);
    }

    getSize(assetId) {
        return this.sizeMapping[assetId] || 0;
    }

    ensureEnoughMemory(assetId, extraSize) {
        if (this.memoryUsage + extraSize > this.capacity) {
            const toDelete = this.cache.getBottom();
            if (!toDelete
                || toDelete === assetId
            ) {
                return false;
            }

            this.cache.remove(toDelete);
            this.memoryUsage -= this.sizeMapping[toDelete];
            delete this.sizeMapping[toDelete];
        }

        return true;
    }

    set(assetId, noteValues, increasePriority = false) {
        if (increasePriority) {
            this.cache.increasePriority(assetId);
        }

        const {
            size: prevSize = 0,
        } = this.cache.get(assetId) || {};
        const size = sizeOfNoteValues(noteValues);
        const extraSize = size - prevSize;
        if (extraSize > 0) {
            this.ensureEnoughMemory(assetId, extraSize);
        }

        this.cache.add(assetId, noteValues);
        this.sizeMapping[assetId] = size;
        this.memoryUsage += size;
    }

    add(assetId, note, increasePriority = false) {
        if (increasePriority) {
            this.cache.increasePriority(assetId);
        }

        this.ensureEnoughMemory(assetId, 1);
        const {
            key,
            value,
        } = note;
        const noteValues = this.get(assetId);
        if (!noteValues) {
            this.cache.add(assetId, {
                [value]: [key],
            });
        } else {
            if (!noteValues[value]) {
                noteValues[value] = [];
            } else if (noteValues[value].indexOf(key) >= 0) {
                return false;
            }
            noteValues[value].push(key);
        }

        if (!this.sizeMapping[assetId]) {
            this.sizeMapping[assetId] = 0;
        }
        this.sizeMapping[assetId] += 1;
        this.memoryUsage += 1;
        return true;
    }

    remove(assetId, note, increasePriority = false) {
        if (increasePriority) {
            this.cache.increasePriority(assetId);
        }

        const noteValues = this.get(assetId);
        if (!noteValues) return false;

        const {
            key,
            value,
        } = note;
        if (!noteValues[value]) return false;

        const idx = noteValues[value].indexOf(key);
        if (idx < 0) return false;

        noteValues[value].splice(idx, 1);

        this.sizeMapping[assetId] -= 1;
        this.memoryUsage -= 1;
        return true;
    }

    get(assetId, increasePriority = false) {
        if (!this.cache.has(assetId)) {
            return null;
        }

        if (increasePriority) {
            this.cache.increasePriority(assetId);
        }

        return this.cache.get(assetId);
    }
}
