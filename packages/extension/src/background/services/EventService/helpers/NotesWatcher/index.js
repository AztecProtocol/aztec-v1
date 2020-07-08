import async from 'async';
import NoteService from '~/background/services/NoteService';
import {
    subscription as NoteSubscription,
    saveNotes,
} from '../../utils/note';
import {
    warnLog,
    errorLog,
} from '~/utils/log';

const WATCHER_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    ACTIVE: 'ACTIVE',
    FAILED: 'FAILED',
};

class Watcher {
    constructor({
        networkId,
    }) {
        this.config = {
            networkId,
        };
        /**
         * {
         *  '0x0': {
         *    assets: [],
         *    lastSyncedBlock: 0,
         *    subscription: null,
         *    status: false,
         *  }
         * }
         */
        this.addresses = new Map();
        this.paused = false;
        this.saveQueue = async.queue(async (task, callback) => {
            const {
                address,
                groupedNotes,
            } = task;

            await saveNotes(groupedNotes, networkId);

            const syncAddress = this.addresses.get(address);
            const lastSyncedBlock = groupedNotes.lastBlockNumber();

            this.addresses.set(address, {
                ...syncAddress,
                lastSyncedBlock,
            });

            callback();
        }, 1);
    }

    isUnderWatching({
        address,
        assetAddress,
    }) {
        const syncAddress = this.addresses.get(address);
        const {
            assets: activeAssets = [],
        } = syncAddress || {};
        return activeAssets.findIndex(({ registryOwner }) => registryOwner === assetAddress) >= 0;
    }

    watcherStatus({
        address,
    }) {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`Notes Watcher for "${address}" eth address is not in process.`);
            return null;
        }
        const {
            status,
        } = syncAddress;
        return status;
    }

    async stopWatching({
        address,
    }) {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            return {
                error: new Error(`Notes Watcher for "${address}" eth address is not in process.`),
                isSuccessful: false,
            };
        }

        const {
            subscription,
        } = syncAddress;

        const {
            error,
        } = await NoteSubscription.unsubscribe(subscription);

        if (error) {
            return {
                error,
                isSuccessful: false,
            };
        }

        this.addresses.set(address, {
            ...syncAddress,
            subscription: null,
            status: true,
        });

        return {
            error: null,
            isSuccessful: true,
        };
    }

    async appendAssets(options) {
        const {
            address,
            assets,
            lastSyncedBlock,
        } = options;

        const nonExistingAssets = assets.filter(({ registryOwner }) => !this.isUnderWatching({
            address,
            assetAddress: registryOwner,
        }));

        if (!nonExistingAssets.length) {
            return;
        }

        const currSyncAddress = this.addresses.get(address) || {};
        const {
            status: currentStatus = WATCHER_STATUS.NOT_STARTED,
            lastSyncedBlock: currentLastSyncedBlock,
            assets: currentAssets = [],
        } = currSyncAddress;
        if (currentStatus === WATCHER_STATUS.ACTIVE) {
            const {
                error,
                isSuccessful,
            } = await this.stopWatching({ address });

            if (!isSuccessful) {
                errorLog(error);
                return;
            }
        }

        // eslint-disable-next-line max-len
        const lowestSyncedBlock = !currentLastSyncedBlock || lastSyncedBlock < currentLastSyncedBlock ? lastSyncedBlock : currentLastSyncedBlock;

        const watchingOptions = {
            assets: [
                ...currentAssets,
                ...nonExistingAssets,
            ],
            lastSyncedBlock: lowestSyncedBlock,
            address,
        };

        const subscription = await this.startWatching(watchingOptions);
        const syncAddress = this.addresses.get(address);
        this.addresses.set(address, {
            ...syncAddress,
            subscription,
            lastSyncedBlock,
            status: WATCHER_STATUS.ACTIVE,
            assets: watchingOptions.assets,
        });
    }

    async startWatching(options) {
        const {
            address,
            assets,
            lastSyncedBlock,
        } = options;

        const syncAddress = this.addresses.get(address);
        const {
            status: currentStatus,
        } = syncAddress || {};

        if (currentStatus === WATCHER_STATUS.ACTIVE) {
            warnLog(`Notes Watcher already started for "${address}" eth address.`);
            return null;
        }

        const {
            networkId,
        } = this.config;
        const fromAssets = assets.map(({ registryOwner }) => registryOwner);

        const {
            subscription,
            onData,
            onError,
        } = await NoteSubscription.subscribe({
            owner: address,
            fromBlock: lastSyncedBlock + 1,
            fromAssets,
            networkId,
        });

        onData(async (groupedNotes) => {
            if (groupedNotes.isEmpty()) {
                return;
            }

            const {
                createNotes,
                updateNotes,
                destroyNotes,
            } = groupedNotes;
            const newNotes = [
                ...createNotes,
                ...updateNotes,
                ...destroyNotes,
            ].filter(({ owner }) => owner === address);

            NoteService.addNotes(
                networkId,
                address,
                newNotes,
            );

            this.saveQueue.push({
                name: 'Save Notes',
                groupedNotes,
                address,
            });
        });

        onError(async (error) => {
            this.handleFetchError(error);
        });

        return subscription;
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync CreateNote / UpdateMetadata / DestroyNote with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };
}

export default Watcher;
