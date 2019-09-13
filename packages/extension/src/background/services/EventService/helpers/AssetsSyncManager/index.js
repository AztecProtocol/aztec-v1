import {
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../../Web3Service'
import {
    fetchAssets,
} from '../utils/fetchAssets'
import {
    createBulkAssets
} from '../utils/asset';


class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
        };
        this.syncConfig = undefined;
        this.networks = new Map();
        this.paused = false;
        this.progressSubscriber = null;
    }

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync Assets with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (prevState = {}) => {
        if (!this.syncConfig) {
            warnLog(`Assets syncing with is not in process.`);
            return;
        }

        this.syncConfig = {
            ...syncNetwork,
            pausedState: prevState,
        };
    };

    syncProgress = async() => {
        if (!this.syncConfig) {
            warnLog(`Assets syncing is not in process.`);
            return;
        }

        const blocks = await Web3Service(networkId).eth.getBlockNumber();
        const {
            lastSyncedBlock,
        } = this.syncConfig;

        return {
            blocks, 
            lastSyncedBlock,
        };
    };

    setProgressCallback = (callback) => {
        this.progressSubscriber = callback;
    };

    resume = () => {
        if (!this.syncConfig) {
            warnLog(`Assets syncing is not in process.`);
            return;
        }

        const {
            pausedState,
        } = this.syncConfig;
        if (!pausedState) {
            warnLog(`Assets syncing is already running.`);
            return;
        }

        this.syncConfig = {
            ...syncNetwork,
            pausedState: null,
        };

        this.syncAssets({
            ...pausedState,
        });
    };

    isSynced = ({
        networkId,
    }) => {
        if (!this.syncConfig) {
            warnLog(`Assets syncing is not in process.`);
            return;
        }

        const {
            syncing,
        } = this.syncConfig;
        return !syncing;
    }

    async syncAssets(options) {
        const {
            lastSyncedBlock,
        } = options;

        if (this.syncConfig.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(options);
            return;
        }

        this.syncConfig = {
            ...syncNetwork,
            syncing: true,
            syncReq: null,
        };

        const {
            syncReq: prevSyncReq,
            networkId,
        } = this.syncConfig;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            syncInterval,
        } = this.config;

        const currentBlock = await Web3Service(networkId).eth.getBlockNumber();
        let newLastSyncedBlock = lastSyncedBlock;

        if(currentBlock > lastSyncedBlock) {
            const fromBlock = lastSyncedBlock + 1;
            const toBlock = currentBlock;

            const {
                error,
                assets: newAssets,
            } = await fetchAssets({
                fromBlock,
                toBlock,
                networkId,
            });
    
            if (error) {
                this.handleFetchError(error);

            } else {
                await createBulkAssets(newAssets, networkId);
                newLastSyncedBlock = toBlock;

                !this.progressSubscriber || this.progressSubscriber({
                    blocks: currentBlock, 
                    lastSyncedBlock: newLastSyncedBlock,
                });
            }
        }

        const syncReq = setTimeout(() => {
            this.syncAssets({
                ...options,
                lastSyncedBlock: newLastSyncedBlock,
            });
        }, syncInterval);

        this.syncConfig = {
            ...syncNetwork,
            syncing: false,
            syncReq,
            lastSyncedBlock: newLastSyncedBlock,
        };
    }

    async sync({
        lastSyncedBlock,
        networkId,
    }) {
        if (!this.syncConfig) {
            this.syncConfig = {
                syncing: false,
                syncReq: null,
                lastSyncedBlock,
                networkId,
            };
        }
        await this.syncAssets({
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
