import {
    argsError,
} from '~utils/error';
import {
    warnLog,
} from '~utils/log';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import recoverFromStorage from '../utils/recoverFromStorage';
import syncAssetNoteData from '../utils/syncAssetNoteData';
import mergeWithLatestAsset from '../utils/mergeWithLatestAsset';
import mergeAssetNoteData from '../utils/mergeAssetNoteData';
import removeDestroyedNotes from '../utils/removeDestroyedNotes';
import saveToStorage from '../utils/saveToStorage';
import pickNotes from '../utils/pickNotes';
import newAssetNoteData from '../utils/newAssetNoteData';

export default class NoteManager {
    constructor() {
        this.owner = {
            address: '',
            linkedPublicKey: '',
            linkedPrivateKey: '',
        };
        this.assetNoteDataMapping = {
            /**
             * Structure in assetNoteDataMapping:
             *     [assetId]: {
             *         balance: Int!
             *         noteValues: {
             *             [value]: [NoteKey!],
             *         },
             *         syncing: Boolean!,
             *         lastSynced: NoteKey!,
             *     }
             */
        };
        this.syncing = false;
        this.queue = [];
        this.networkId = null;
    }

    reset() {
        this.owner = {
            address: '',
            linkedPublicKey: '',
            linkedPrivateKey: '',
        };
        this.assetNoteDataMapping = {};
        this.syncing = false;
        this.queue = [];
        this.networkId = null;
    }

    warnInconsistentOwner(inputAddress) {
        warnLog(`Owner address does not match the current address. ${inputAddress} !== ${this.owner.address}`);
    }

    async init(ownerAddress, linkedPrivateKey, linkedPublicKey, networkId) {
        if (ownerAddress === this.owner.address) return;

        this.syncing = true;
        this.owner = {
            address: ownerAddress,
            linkedPublicKey,
            linkedPrivateKey,
        };
        this.networkId = networkId;
        let assetNoteDataMapping = await recoverFromStorage(
            ownerAddress,
            linkedPrivateKey,
        );
        assetNoteDataMapping = await mergeWithLatestAsset(ownerAddress, linkedPrivateKey, assetNoteDataMapping, networkId);
        // check if the input owner is still the same
        // 'init' might have been called again with a different address
        // before 'recoverFromStorage' is done
        if (ownerAddress === this.owner.address) {
            this.assetNoteDataMapping = assetNoteDataMapping;
            this.syncing = false;
            this.flushQueue();
        }
    }

    async save() {
        await saveToStorage(
            this.owner.address,
            this.owner.linkedPublicKey,
            this.assetNoteDataMapping,
        );
    }

    async waitInQueue(
        method,
        args,
    ) {
        return new Promise((resolve) => {
            this.queue.push({
                method,
                args,
                resolve,
            });
        });
    }

    async flushQueue() {
        const count = this.queue.length;
        let flushed = 0;
        for (let i = 0; i < count && !this.syncing; i += 1) {
            const idx = i - flushed;
            const {
                args,
            } = this.queue[idx];
            if (!args.assetId
                || !this.isAssetSyncing(args.assetId)
            ) {
                const {
                    method,
                    resolve,
                } = this.queue.splice(idx, 1)[0];
                flushed += 1;

                const result = await this[method](args); // eslint-disable-line no-await-in-loop
                resolve(result);
            }
        }
    }

    async ensureSynced(cbName, args = {}) {
        if (this.syncing
            || (args.assetId && this.isAssetSyncing(args.assetId))
        ) {
            return this.waitInQueue(
                cbName,
                args,
            );
        }
        
        return this[cbName](args);
    }

    isAssetSyncing(assetId) {
        const {
            syncing,
        } = this.safeFind(this.owner.address)(assetId);

        return !!syncing;
    }

    async syncAsset({
        ownerAddress,
        assetId,
        removeDestroyed = true,
    }) {
        if (this.syncing
            || this.isAssetSyncing(assetId)
        ) {
            return this.waitInQueue(
                'syncAsset',
                {
                    ownerAddress,
                    assetId,
                },
            );
        }

        if (ownerAddress !== this.owner.address) {
            this.warnInconsistentOwner(ownerAddress);
            return {};
        }

        let prevLastSynced = '';
        if (!this.assetNoteDataMapping[assetId]) {
            this.assetNoteDataMapping[assetId] = newAssetNoteData();
        } else {
            ({
                lastSynced: prevLastSynced,
            } = this.assetNoteDataMapping[assetId]);
        }
        this.assetNoteDataMapping[assetId].syncing = true;

        let purifiedNoteData = this.assetNoteDataMapping[assetId];
        if (removeDestroyed && prevLastSynced) {
            purifiedNoteData = await removeDestroyedNotes(this.assetNoteDataMapping[assetId]);
        }

        const extraNoteData = await syncAssetNoteData(
            ownerAddress,
            this.owner.linkedPrivateKey,
            assetId,
            prevLastSynced,
            this.networkId,
        );

        if (ownerAddress !== this.owner.address) {
            this.warnInconsistentOwner(ownerAddress);
            return {};
        }

        this.assetNoteDataMapping[assetId] = mergeAssetNoteData(
            purifiedNoteData,
            extraNoteData,
        );

        delete this.assetNoteDataMapping[assetId].syncing;

        this.flushQueue();

        return this.assetNoteDataMapping;
    }

    safeFind(ownerAddress) {
        let group = this.assetNoteDataMapping;
        if (ownerAddress !== this.owner.address) {
            this.warnInconsistentOwner(ownerAddress);
            group = {};
        }

        return assetId => group[assetId]
            || newAssetNoteData();
    }

    addNoteValue({
        assetId,
        ownerAddress,
        value,
        noteKey,
    }) {
        if (ownerAddress !== this.owner.address) {
            this.warnInconsistentOwner(ownerAddress);
            return;
        }

        let group = this.assetNoteDataMapping;
        if (!group[assetId]) {
            group[assetId] = newAssetNoteData();
        }

        group = group[assetId];
        if (!group.noteValues[value]) {
            group.noteValues[value] = [];
        } else if (group.noteValues[value].indexOf(noteKey) >= 0) {
            return;
        }

        group.noteValues[value].push(noteKey);

        if (value > 0) {
            group.balance += value;
            const {
                balance,
            } = group.balance;
            ClientSubscriptionService.onChange('ASSET_BALANCE', assetId, balance);
        }
    }

    removeNoteValue({
        assetId,
        ownerAddress,
        value,
        noteKey,
    }) {
        if (ownerAddress !== this.owner.address) {
            this.warnInconsistentOwner(ownerAddress);
            return;
        }

        if (!this.assetNoteDataMapping[assetId]) return;

        const noteKeys = this.assetNoteDataMapping[assetId].noteValues[value];
        if (!noteKeys) return;

        const idx = noteKeys.indexOf(noteKey);
        if (idx < 0) return;

        const group = this.assetNoteDataMapping[assetId];
        noteKeys.splice(idx, 1);
        if (!noteKeys.length) {
            delete group.noteValues[value];
        }

        if (value > 0) {
            group.balance -= value;
            ClientSubscriptionService.onChange('ASSET_BALANCE', assetId, group.balance);
        }
    }

    async getBalance({
        ownerAddress,
        assetId,
    }) {
        return this.safeFind(ownerAddress)(assetId).balance;
    }

    pick({
        ownerAddress,
        assetId,
        minSum,
        numberOfNotes,
        allowLessNumberOfNotes,
    }) {
        const {
            balance,
            noteValues,
        } = this.safeFind(ownerAddress)(assetId);

        if (minSum > balance) {
            throw argsError('note.pick.sum', {
                messageOptions: {
                    value: minSum,
                },
            });
        }

        return pickNotes({
            noteValues,
            minSum,
            numberOfNotes,
            allowLessNumberOfNotes,
        });
    }
}
