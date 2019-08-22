import {
    warnLog,
    errorLog,
} from '~utils/log';
import fetchCreateNoteRegistries from '../utils/fetchCreateNoteRegistries'
import addCreateNoteRegistry from '../utils/addCreateNoteRegistry';
import asyncForEach from '~utils/asyncForEach';

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
        };
        this.networks = new Map();
        this.paused = false;
    }

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    isInQueue(networkId) {
        const syncNetwork = this.networks.get(networkId);
        return !!(syncNetwork
            && (syncNetwork.syncing || syncNetwork.syncReq)
        );
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync CreateNoteRegistry with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (networkId, prevState = {}) => {
        const syncNetwork = this.networks.get(networkId);
        if (!syncNetwork) {
            warnLog(`CreateNoteRegistry syncing with networkId: "${networkId}" is not in process.`);
            return;
        }

        this.networks.set(networkId, {
            ...syncNetwork,
            pausedState: prevState,
        });
    };

    resume = (networkId) => {
        const syncNetwork = this.networks.get(networkId);
        if (!syncNetwork) {
            warnLog(`CreateNoteRegistry syncing with networkId: "${networkId}" is not in process.`);
            return;
        }

        const {
            pausedState,
        } = syncNetwork;
        if (!pausedState) {
            warnLog(`CreateNoteRegistry with networkId: ${networkId} is already running.`);
            return;
        }

        this.networks.set(networkId, {
            ...syncNetwork,
            pausedState: null,
        });

        this.syncCreateNoteRegistry({
            ...pausedState,
            networkId,
        });
    };

    async syncCreateNoteRegistry(options) {
        const {
            networkId,
            lastSyncedBlock,
        } = options;

        const syncNetwork = this.networks.get(networkId);
        if (syncNetwork.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(networkId, options);
            return;
        }

        this.networks.set(networkId, {
            ...syncNetwork,
            syncing: true,
            syncReq: null,
        });

        const {
            syncReq: prevSyncReq,
        } = syncNetwork;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            syncInterval,
        } = this.config;

        const newCreateNoteRegistries = await fetchCreateNoteRegistries({
            networkId,
            fromBlock: lastSyncedBlock,
            onError: this.handleFetchError,
        });

        console.log("newCreateNoteRegistries: " + JSON.stringify(newCreateNoteRegistries))

        await asyncForEach(newCreateNoteRegistries, async (createNoteRegistry) => {
            await addCreateNoteRegistry(createNoteRegistry);
        });

        const syncReq = setTimeout(() => {
            this.syncCreateNoteRegistry({
                ...options,
                lastSyncedBlock: lastSyncedBlock + 1,
            });
        }, syncInterval);

        this.networks.set(networkId, {
            ...syncNetwork,
            syncing: false,
            syncReq,
            lastSyncedBlock,
        });
    }

    async sync({
        networkId,
        lastSyncedBlock,
    }) {
        let syncNetwork = this.networks.get(networkId);
        if (!syncNetwork) {
            syncNetwork = {
                syncing: false,
                syncReq: null,
                lastSyncedBlock,
            };
            this.networks.set(networkId, syncNetwork);
        }
        return this.syncCreateNoteRegistry({
            networkId,
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
