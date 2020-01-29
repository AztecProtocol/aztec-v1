import EventListeners from '~/utils/EventListeners';
import {
    defaultMaxNotes,
    defaultNotesPerBatch,
    defaultNotesPerSyncBatch,
    defaultSyncInterval,
} from '../config';
import fetchNotesFromIndexedDB from '../utils/fetchNotesFromIndexedDB';

export default class RawNoteManager {
    constructor({
        networkId,
        owner,
        maxNotes = defaultMaxNotes,
        notesPerBatch = defaultNotesPerBatch,
        notesPerSyncBatch = defaultNotesPerSyncBatch,
        syncInterval = defaultSyncInterval,
    }) {
        this.networkId = networkId;
        this.owner = owner;
        this.notesPerBatch = notesPerBatch;
        this.notesPerSyncBatch = notesPerSyncBatch;

        // TODO - remove from the top of tail notes if numberOfNotes exceeds this.capacity
        this.capacity = maxNotes;
        this.numberOfNotes = 0;

        this.minHeadBlockNumber = -1;
        this.maxHeadBlockNumber = -1;
        this.minTailBlockNumber = -1;
        this.maxTailBlockNumber = -1;
        this.prependNotesMapping = {};
        this.headNotesMapping = {};
        this.tailNotesMapping = {}; // added by calling NoteService.addNotes()
        this.assetLastSyncedMapping = {};


        this.syncInterval = syncInterval;
        // TODO - syncing for asset's prepend notes should be run with a PriorityQueue
        this.syncAssetReqMapping = {};
        this.syncFromIndexedDBReq = null;

        this.fetchQueues = {};

        this.locked = false;

        this.eventListeners = new EventListeners(['newNotes']);
    }

    lock() {
        this.locked = true;
    }

    startSync(fromBlockNumber) {
        if (this.syncFromIndexedDBReq
            || !this.requireHeadNotes()
        ) return;

        this.minHeadBlockNumber = fromBlockNumber;
        this.maxHeadBlockNumber = fromBlockNumber;
        this.syncFromIndexedDBReq = setTimeout(async () => {
            await this.startSyncInterval();
        }, 0);
    }

    setAssetLastSynced(assetId, lastSynced) {
        if (lastSynced >= this.minHeadBlockNumber - 1
            || this.assetLastSyncedMapping[assetId] >= 0
        ) return;

        this.assetLastSyncedMapping[assetId] = lastSynced;

        if (!this.syncAssetReqMapping[assetId]) {
            this.syncAssetReqMapping[assetId] = setTimeout(async () => {
                await this.startSyncAssetInterval(assetId);
            }, 0);
        }
    }

    async startSyncInterval() {
        if (this.locked || !this.requireHeadNotes()) return;

        const notes = await this.fetchHeadNotes();
        const interval = notes.length === this.notesPerSyncBatch
            ? 0
            : this.syncInterval;

        this.syncFromIndexedDBReq = setTimeout(async () => {
            await this.startSyncInterval();
        }, interval);
    }

    async startSyncAssetInterval(assetId) {
        if (this.locked) return;

        const notes = await this.fetchAssetNotes(assetId);
        if (notes.length < this.notesPerSyncBatch) return;

        this.syncAssetReqMapping[assetId] = setTimeout(async () => {
            await this.startSyncAssetInterval(assetId);
        }, 0);
    }

    requirePrependNotes(assetId) {
        return (assetId in this.assetLastSyncedMapping)
            && this.assetLastSyncedMapping[assetId] < this.minHeadBlockNumber - 1;
    }

    requireHeadNotes() {
        return this.minTailBlockNumber === -1
            || (this.maxHeadBlockNumber < this.minTailBlockNumber - 1);
    }

    getCurrentSynced(assetId) {
        if (this.requirePrependNotes(assetId)) {
            return this.assetLastSyncedMapping[assetId];
        }
        if (this.maxTailBlockNumber >= 0
            && !this.requireHeadNotes()
        ) {
            return this.maxTailBlockNumber;
        }
        return this.maxHeadBlockNumber;
    }

    async waitInFetchQueue(assetId) {
        if (!this.fetchQueues[assetId]) {
            this.fetchQueues[assetId] = [];
        }
        return new Promise((resolve) => {
            this.fetchQueues[assetId].push(resolve);
        });
    }

    flushNextInFetchQueue(assetId, numberOfBatches = 1) {
        const queue = this.fetchQueues[assetId];
        if (!queue) return;

        const count = Math.min(numberOfBatches, queue.length);
        const toFlush = queue.splice(0, count);
        toFlush.forEach(next => next());
    }

    flushAssetInFetchQueue(assetId) {
        const queue = this.fetchQueues[assetId];
        if (!queue) return;

        this.fetchQueues[assetId] = [];
        queue.forEach(next => next());
    }

    flushAllInFetchQueue() {
        const queues = Object.values(this.fetchQueues);
        this.fetchQueues = {};
        queues.forEach((queue) => {
            queue.forEach(next => next());
        });
    }

    async fetchAndRemove(assetId) {
        if (this.fetchQueues[assetId]
            && this.fetchQueues[assetId].length
        ) {
            await this.waitInFetchQueue(assetId);
        }

        let notes;

        let prependNotes = this.prependNotesMapping[assetId] || [];
        if (prependNotes.length < this.notesPerBatch
            && this.requirePrependNotes(assetId)
        ) {
            await this.waitInFetchQueue(assetId);
            prependNotes = this.prependNotesMapping[assetId] || [];
        }
        notes = prependNotes.splice(0, this.notesPerBatch);

        // return notes from the same source
        // even when the number is not enough
        // so that it won't have to wait in the queue again
        // which might cause the returned notes' block numbers not in correct order
        if (!notes.length) {
            let headNotes = this.headNotesMapping[assetId] || [];
            if (headNotes.length < this.notesPerBatch
                && this.requireHeadNotes()
            ) {
                await this.waitInFetchQueue(assetId);
                headNotes = this.headNotesMapping[assetId] || [];
            }
            if (headNotes.length > 0) {
                notes = headNotes.splice(0, this.notesPerBatch);
            }
        }

        if (!notes.length) {
            const tailNotes = this.tailNotesMapping[assetId] || [];
            if (tailNotes.length > 0) {
                notes = tailNotes.splice(0, this.notesPerBatch);
            }
        }

        this.numberOfNotes -= notes.length;

        return notes;
    }

    async fetchAssetNotes(assetId) {
        const notes = await fetchNotesFromIndexedDB(
            this.networkId,
            this.owner.address,
            {
                assetId,
                count: this.notesPerSyncBatch,
                fromBlockNumber: this.assetLastSyncedMapping[assetId],
                toBlockNumber: this.minHeadBlockNumber,
            },
        );

        const newNotes = this.prependHeads(assetId, notes);

        if (newNotes.length < this.notesPerSyncBatch) {
            this.flushAssetInFetchQueue(assetId);
        } else {
            const validBatch = Math.floor(newNotes.length / this.notesPerBatch);
            this.flushNextInFetchQueue(assetId, validBatch);
        }

        return newNotes;
    }

    async fetchHeadNotes() {
        // TODO - might be some notes that have the same block number with previous max block number
        const notes = await fetchNotesFromIndexedDB(
            this.networkId,
            this.owner.address,
            {
                count: this.notesPerSyncBatch,
                fromBlockNumber: this.maxHeadBlockNumber,
                toBlockNumber: this.minTailBlockNumber,
            },
        );

        const newNotes = this.appendHeads(notes);

        if (newNotes.length < this.notesPerSyncBatch) {
            this.flushAllInFetchQueue();
        } else {
            const assetIds = newNotes.reduce((ids, {
                asset,
            }) => {
                ids.add(asset);
                return ids;
            }, new Set());

            assetIds.forEach((assetId) => {
                const headNotes = this.headNotesMapping[assetId];
                const validBatch = Math.floor(headNotes.length / this.notesPerBatch);
                if (validBatch) {
                    this.flushNextInFetchQueue(assetId, validBatch);
                }
            });
        }

        return newNotes;
    }

    prependHeads(assetId, notes) {
        const lastNote = notes[notes.length - 1];

        let newNotes = notes;
        if (lastNote
            && lastNote.blockNumber >= this.minHeadBlockNumber
        ) {
            const lastIndex = notes.findIndex(({
                blockNumber,
            }) => blockNumber >= this.minHeadBlockNumber);
            newNotes = notes.slice(0, lastIndex);
        }

        this.assetLastSyncedMapping[assetId] = newNotes.length < this.notesPerSyncBatch
            ? this.minHeadBlockNumber - 1
            : lastNote.blockNumber;
        this.numberOfNotes += newNotes.length;

        if (newNotes.length) {
            if (!this.prependNotesMapping[assetId]) {
                this.prependNotesMapping[assetId] = [];
            }
            this.prependNotesMapping[assetId] = this.prependNotesMapping[assetId].concat(newNotes);
        }

        return newNotes;
    }

    appendHeads(notes) {
        const lastNote = notes[notes.length - 1];

        let newNotes = notes;
        if (lastNote
            && this.minTailBlockNumber >= 0
            && lastNote.blockNumber >= this.minTailBlockNumber
        ) {
            const lastIndex = notes.findIndex(({
                blockNumber,
            }) => blockNumber >= this.minTailBlockNumber);
            newNotes = notes.slice(0, lastIndex);
        }

        if (lastNote || this.minTailBlockNumber >= 0) {
            this.maxHeadBlockNumber = newNotes.length < this.notesPerBatch
                && this.minTailBlockNumber !== -1
                ? this.minTailBlockNumber - 1
                : (lastNote && lastNote.blockNumber);
        }
        this.numberOfNotes += newNotes.length;

        const toNotify = [];
        newNotes.forEach((note) => {
            const {
                asset,
            } = note;
            if (!this.headNotesMapping[asset]
                || !this.headNotesMapping[asset].length
            ) {
                this.headNotesMapping[asset] = [];
                toNotify.push(asset);
            }
            this.headNotesMapping[asset].push(note);
        });
        toNotify.forEach((assetId) => {
            this.eventListeners.notify('newNotes', assetId);
        });

        return newNotes;
    }

    appendTails(notes) {
        let [firstNote] = notes;
        if (!firstNote) return [];

        let newNotes = notes;
        if (firstNote.blockNumber <= this.maxHeadBlockNumber + 1) {
            if (this.syncFromIndexedDBReq !== null) {
                clearTimeout(this.syncFromIndexedDBReq);
            }

            const firstIndex = notes.findIndex(({
                blockNumber,
            }) => blockNumber > this.maxHeadBlockNumber);
            if (firstIndex < 0) return [];

            firstNote = notes[firstIndex];
            newNotes = notes.slice(firstIndex, notes.length);
        }

        if (this.minTailBlockNumber === -1) {
            this.minTailBlockNumber = firstNote.blockNumber;
        }

        const lastNote = newNotes[newNotes.length - 1];
        this.maxTailBlockNumber = lastNote.blockNumber;
        this.numberOfNotes += newNotes.length;

        const toNotify = [];
        newNotes.forEach((note) => {
            const {
                asset,
            } = note;
            if (!this.tailNotesMapping[asset]
                || !this.tailNotesMapping[asset].length
            ) {
                this.tailNotesMapping[asset] = [];
                toNotify.push(asset);
            }
            this.tailNotesMapping[asset].push(note);
        });

        toNotify.forEach((assetId) => {
            this.eventListeners.notify('newNotes', assetId);
        });

        return newNotes;
    }
}
