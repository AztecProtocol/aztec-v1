import {
    warnLog,
} from '~utils/log';
import {
    defaultMaxNotes,
    defaultNotesPerBatch,
    defaultSyncInterval,
} from '../config';
import fetchNotesFromIndexedDB from '../utils/fetchNotesFromIndexedDB';

export default class RawNoteManager {
    constructor({
        networkId,
        owner,
        maxNotes = defaultMaxNotes,
        notesPerBatch = defaultNotesPerBatch,
        syncInterval = defaultSyncInterval,
    }) {
        this.networkId = networkId;
        this.owner = owner;
        this.notesPerBatch = notesPerBatch;

        // TODO - remove from the top of tail notes if numberOfNotes exceeds this.capacity
        this.capacity = maxNotes;
        this.numberOfNotes = 0;

        this.minHeadBlockNumber = -1;
        this.maxHeadBlockNumber = -1;
        this.minTailBlockNumber = -1;
        this.maxTailBlockNumber = -1;
        this.headNotesMapping = {};
        this.tailNotesMapping = {}; // added by calling NoteService.addNotes()
        this.assetLastSyncedMapping = {};

        this.syncInterval = syncInterval;
        this.syncFromIndexedDBReq = null;

        this.eventListeners = {
            newNotes: [],
        };
    }

    addListener(eventName, cb) {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call RawNoteManager.addListener('${eventName}').`,
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
                `Cannot call RawNoteManager.removeListener('${eventName}').`,
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

    async startSync(fromBlockNumber) {
        this.minHeadBlockNumber = fromBlockNumber;
        this.maxHeadBlockNumber = fromBlockNumber;
        await this.fetchHeadNotes();
    }

    async startSyncInterval() {
        const notes = await this.fetchHeadNotes();
        const interval = notes.length === this.notesPerBatch
            ? 0
            : this.syncInterval;

        this.syncFromIndexedDBReq = setTimeout(async () => {
            await this.startSyncInterval();
        }, interval);
    }

    requirePrependNotes(assetId) {
        return (assetId in this.assetLastSyncedMapping)
            && this.assetLastSyncedMapping[assetId] < this.minHeadBlockNumber - 1;
    }

    requireHeadNotes() {
        return this.minTailBlockNumber === -1
            || (this.maxHeadBlockNumber < this.minTailBlockNumber - 1);
    }

    setAssetLastSynced(assetId, lastSynced) {
        if (lastSynced >= this.minHeadBlockNumber - 1) return;

        this.assetLastSyncedMapping[assetId] = lastSynced;
    }

    getCurrentSynced(assetId) {
        if (this.requirePrependNotes(assetId)) {
            return this.assetLastSyncedMapping[assetId];
        }
        if (this.maxTailBlockNumber >= 0) {
            return this.maxTailBlockNumber;
        }
        return this.maxHeadBlockNumber;
    }

    async fetchAndRemove(assetId, count = this.notesPerBatch) {
        let notes = [];
        let headNotes = this.headNotesMapping[assetId] || [];
        if (!headNotes || headNotes.length < count) {
            // TODO - await previous fetchMoreForAsset
            await this.fetchMoreForAsset();
            headNotes = this.headNotesMapping[assetId] || [];
        }

        notes = headNotes.splice(0, count);
        this.numberOfNotes -= notes.length;

        if (headNotes.length < count) {
            // run this in parallel to make the next call return faster
            this.fetchMoreForAsset(assetId);
        }

        if (notes.length < count) {
            const tailNotes = this.tailNotesMapping[assetId];
            if (tailNotes) {
                const restNotes = tailNotes.splice(0, count - notes.length);
                notes = notes.concat(restNotes);
                this.numberOfNotes -= restNotes.length;
            }
        }

        return notes;
    }

    async fetchMoreForAsset(assetId, count) {
        let notes = [];
        if (this.requirePrependNotes(assetId)) {
            notes = await this.fetchAssetNotes(assetId);
        }

        while (this.requireHeadNotes() && notes.length < count) {
            const newNotes = await this.fetchHeadNotes(); // eslint-disable-line no-await-in-loop
            if (!newNotes.length) break;

            const notesForAsset = newNotes.filter(({
                asset,
            }) => asset === assetId);
            notes = notes.concat(notesForAsset);
        }

        return notes;
    }

    async fetchAssetNotes(assetId) {
        const notes = await fetchNotesFromIndexedDB(
            this.networkId,
            this.owner.address,
            {
                assetId,
                count: this.notesPerBatch,
                fromBlockNumber: this.assetLastSyncedMapping[assetId],
                toBlockNumber: this.minHeadBlockNumber,
            },
        );

        this.prependHeads(assetId, notes);

        return notes;
    }

    async fetchHeadNotes() {
        const notes = await fetchNotesFromIndexedDB(
            this.networkId,
            this.owner.address,
            {
                count: this.notesPerBatch,
                fromBlockNumber: this.maxHeadBlockNumber,
                toBlockNumber: this.minTailBlockNumber,
            },
        );

        if (notes.length) {
            this.appendHeads(notes);
        } else if (!this.syncFromIndexedDBReq
            && this.minTailBlockNumber === -1
        ) {
            this.syncFromIndexedDBReq = setTimeout(async () => {
                await this.startSyncInterval();
            }, this.syncInterval);
        }


        return notes;
    }

    prependHeads(assetId, notes) {
        const lastNote = notes[notes.length - 1];
        if (!lastNote) return;

        this.assetLastSyncedMapping[assetId] = lastNote.blockNumber;
        this.numberOfNotes += notes.length;

        if (!this.headNotesMapping[assetId]) {
            this.headNotesMapping[assetId] = [];
        }

        this.headNotesMapping[assetId] = this.headNotesMapping[assetId].concat(notes);
    }

    appendHeads(notes) {
        const lastNote = notes[notes.length - 1];
        if (!lastNote) return;

        this.maxHeadBlockNumber = lastNote.blockNumber;

        let newNotes = notes;
        if (lastNote.blockNumber >= this.minTailBlockNumber
            && this.minTailBlockNumber >= 0
        ) {
            const lastIndex = notes.findIndex(({
                blockNumber,
            }) => blockNumber >= this.minTailBlockNumber);
            newNotes = notes.slice(0, lastIndex);
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
            this.notifyListeners('newNotes', assetId);
        });
    }

    appendTails(notes) {
        let [firstNote] = notes;
        if (!firstNote) return;

        if (this.syncFromIndexedDBReq) {
            clearTimeout(this.syncFromIndexedDBReq);
        }

        let newNotes = notes;
        if (firstNote.blockNumber <= this.maxHeadBlockNumber) {
            const firstIndex = notes.findIndex(({
                blockNumber,
            }) => blockNumber > this.maxHeadBlockNumber);
            if (firstIndex < 0) return;

            firstNote = notes[firstIndex];
            newNotes = notes.slice(firstIndex, notes.length);
        }

        if (this.minTailBlockNumber === -1) {
            this.minTailBlockNumber = firstNote.blockNumber;
        }

        this.numberOfNotes += newNotes.length;

        newNotes.forEach((note) => {
            const {
                asset,
            } = note;
            if (!this.tailNotesMapping[asset]
                || !this.tailNotesMapping[asset].length
            ) {
                this.tailNotesMapping[asset] = [];
                this.notifyListeners('newNotes', asset);
            }
            this.tailNotesMapping[asset].push(note);
        });

        const lastNote = newNotes[newNotes.length - 1];
        this.maxTailBlockNumber = lastNote.blockNumber;
    }
}
