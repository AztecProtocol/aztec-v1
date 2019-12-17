import {
    PriorityQueue,
} from '~/utils/dataStructures';
import {
    defaultMaxAssets,
    defaultMaxNotes,
    defaultMaxRawNotes,
    defaultMaxCallbacks,
    defaultMaxProcesses,
    defaultNotesPerBatch,
} from '../config';
import recoverSummaryFromStorage from '../utils/recoverSummaryFromStorage';
import saveToStorage from '../utils/saveToStorage';
import NoteBucketCache from './NoteBucketCache';
import CallbackCache from './CallbackCache';
import RawNoteManager from './RawNoteManager';
import Asset from './Asset';

class AssetManager {
    constructor({
        networkId,
        owner,
        maxAssets = defaultMaxAssets,
        maxNotes = defaultMaxNotes,
        maxRawNotes = defaultMaxRawNotes,
        maxCallbacks = defaultMaxCallbacks,
        maxProcesses = defaultMaxProcesses,
        notesPerBatch = defaultNotesPerBatch,
    }) {
        this.networkId = networkId;
        this.owner = owner;

        this.assetMapping = {};

        this.callbackCache = new CallbackCache(maxCallbacks);
        this.callbackCache.eventListeners.add(
            'priority',
            this.handleCallbackPriorityChanged,
        );

        this.noteBucketCache = new NoteBucketCache({
            maxAssets,
            maxNotes,
        });

        this.rawNoteManager = new RawNoteManager({
            networkId,
            owner,
            maxNotes: maxRawNotes,
            notesPerBatch,
        });

        // TODO - allow more than one active assets
        // will need to pause active asset if its noteValues is deleted in noteBucketCache
        // due to insufficient space
        this.maxActiveAssets = 1;
        this.maxProcesses = maxProcesses;
        this.activeAssets = new PriorityQueue();
        this.pendingAssets = new PriorityQueue();
        this.priority = [];

        this.locked = true;
    }

    async clear() {
        this.locked = true;
        this.rawNoteManager.lock();
        this.rawNoteManager.eventListeners.remove('newNotes', this.handleNewRawNotes);
        await this.saveAll();
    }

    async init() {
        const {
            priority,
            assetSummary,
        } = await recoverSummaryFromStorage(
            this.networkId,
            this.owner,
        );

        const assetIds = Object.keys(assetSummary);
        assetIds.forEach((assetId) => {
            const {
                balance,
                lastSynced,
            } = assetSummary[assetId];

            this.assetMapping[assetId] = new Asset({
                networkId: this.networkId,
                owner: this.owner,
                noteBucketCache: this.noteBucketCache,
                rawNoteManager: this.rawNoteManager,
                maxProcesses: this.maxProcesses,
                assetId,
                balance,
                lastSynced,
            });
        });

        if (!this.priority.length) {
            this.priority = priority
                .filter(id => this.assetMapping[id]);
        }

        const maxLastSynced = Object.values(assetSummary)
            .reduce((max, { lastSynced }) => {
                if (lastSynced > max) return lastSynced;
                return max;
            }, -1);
        this.rawNoteManager.eventListeners.add('newNotes', this.handleNewRawNotes);
        this.rawNoteManager.startSync(maxLastSynced);

        this.locked = false;
        this.syncNext();
    }

    syncNext() {
        if (this.locked) return;

        while (this.activeAssets.size < this.maxActiveAssets) {
            let nextAsset = this.pendingAssets.removeTop();
            if (!nextAsset) {
                const assetId = this.priority.find(id => !this.assetMapping[id].synced
                    && !this.activeAssets.has(this.assetMapping[id]));
                if (assetId) {
                    nextAsset = this.assetMapping[assetId];
                } else {
                    nextAsset = Object.values(this.assetMapping).find(({
                        id,
                        synced,
                    }) => !synced
                        && !this.activeAssets.has(this.assetMapping[id]));
                }
            }
            if (!nextAsset) return;

            this.activeAssets.addToBottom(nextAsset);
            nextAsset.eventListeners.add('synced', this.handleAssetSynced);
            nextAsset.startSync();
        }
    }

    handleAssetSynced = async (assetId) => {
        const asset = this.assetMapping[assetId];
        if (this.pendingAssets.has(asset)) {
            this.pendingAssets.remove(asset);
            asset.startSync();
            return;
        }

        this.activeAssets.remove(asset);
        asset.eventListeners.remove('synced', this.handleAssetSynced);
        this.flushQueue(assetId);
        this.syncNext();

        if (asset.modified) {
            await asset.save();
        }
    };

    handleNewRawNotes = (assetId) => {
        this.ensureAsset(assetId);
        const asset = this.assetMapping[assetId];

        if (this.pendingAssets.has(asset)) {
            return;
        }

        this.pendingAssets.addToBottom(asset);
        this.syncNext();
    };

    ensureAsset(assetId) {
        if (!this.assetMapping[assetId]) {
            this.assetMapping[assetId] = new Asset({
                assetId,
                networkId: this.networkId,
                owner: this.owner,
                noteBucketCache: this.noteBucketCache,
                rawNoteManager: this.rawNoteManager,
                maxProcesses: this.maxProcesses,
            });
        }
    }

    isSynced(assetId) {
        const {
            synced,
        } = this.assetMapping[assetId] || {};
        if (!synced) {
            return false;
        }

        return this.noteBucketCache.has(assetId);
    }

    async flushQueue(assetId) {
        const callbacks = this.callbackCache.remove(assetId);
        if (!callbacks) return;

        const asset = this.get(assetId);
        await Promise.all(callbacks.map(cb => cb(asset)));
    }

    async waitInQueue(assetId, cb) {
        return new Promise((resolve) => {
            this.callbackCache.add(assetId, async (asset) => {
                const result = await cb(asset);
                resolve(result);
            });
        });
    }

    async ensureSynced(assetId, cb) {
        if (!this.isSynced(assetId)) {
            return this.waitInQueue(assetId, cb);
        }

        const asset = this.get(assetId);
        return cb(asset);
    }

    addRawNotes(notes) {
        this.rawNoteManager.appendTails(notes);
    }

    handleCallbackPriorityChanged = (priorityQueue) => {
        const prevPriority = this.priority;
        this.priority = priorityQueue.export();
        [...prevPriority].reverse().forEach((assetId) => {
            if (this.priority.indexOf(assetId) < 0) {
                const asset = this.assetMapping[assetId];
                if (this.activeAssets.has(asset)) {
                    asset.lock();
                    this.activeAssets.remove(asset);
                    this.pendingAssets.addToTop(asset);
                }
            }
        });
        [...this.priority].reverse().forEach((assetId) => {
            this.ensureAsset(assetId);
            const asset = this.assetMapping[assetId];
            if (this.activeAssets.has(asset)) {
                this.pendingAssets.moveToTop(asset);
            } else if (this.pendingAssets.has(asset)) {
                this.pendingAssets.moveToTop(asset);
            } else {
                this.pendingAssets.addToTop(asset);
            }
        });
        this.syncNext();
    };

    async saveAll() {
        const {
            priority,
        } = this.noteBucketCache.export();
        const newSummary = {};
        const newAssetNotes = {};
        Object.keys(this.assetMapping).forEach((assetId) => {
            const asset = this.assetMapping[assetId];
            if (!asset.modified) return;

            const {
                noteValues,
                ...summary
            } = asset.getSnapshot();
            newSummary[assetId] = { ...summary };
            if (noteValues) {
                newAssetNotes[assetId] = noteValues;
            }
        });

        await saveToStorage(
            this.networkId,
            this.owner,
            {
                assetSummary: newSummary,
                assetNotes: newAssetNotes,
                priority,
            },
        );
    }

    get(assetId, increasePriority = false) {
        const {
            balance = 0,
        } = this.assetMapping[assetId] || {};
        const noteValues = this.noteBucketCache.get(assetId, increasePriority) || {};

        return {
            balance,
            noteValues,
            getSortedValues: () => this.noteBucketCache.getSortedValues(assetId),
        };
    }
}

export default AssetManager;
