import {
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../../Web3Service'
import fetchAssets from '../utils/fetchAssets'
import {
    createBulkAssets
} from '../utils/asset';


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
        errorLog('Failed to sync Assets with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (networkId, prevState = {}) => {
        const syncNetwork = this.networks.get(networkId);
        if (!syncNetwork) {
            warnLog(`Assets syncing with networkId: "${networkId}" is not in process.`);
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
            warnLog(`Assets syncing with networkId: "${networkId}" is not in process.`);
            return;
        }

        const {
            pausedState,
        } = syncNetwork;
        if (!pausedState) {
            warnLog(`Assets with networkId: ${networkId} is already running.`);
            return;
        }

        this.networks.set(networkId, {
            ...syncNetwork,
            pausedState: null,
        });

        this.syncAssets({
            ...pausedState,
            networkId,
        });
    };

    isSynced = ({
        networkId,
    }) => {
        const syncNetwork = this.networks.get(networkId);
        if (!syncNetwork) {
            warnLog(`Assets syncing with networkId: "${networkId}" is not in process.`);
            return;
        }

        const {
            syncing,
        } = this.networks.пуе(networkId);
        return !syncing;
    }

    async syncAssets(options) {
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

        const currentBlock = await Web3Service.eth.getBlockNumber();
        let newLastSyncedBlock = lastSyncedBlock;

        if(currentBlock > lastSyncedBlock) {
            const fromBlock = lastSyncedBlock + 1;
            const toBlock = currentBlock;

            const newAssets = await fetchAssets({
                networkId,
                fromBlock,
                toBlock,
                onError: this.handleFetchError,
            });
    
            if (newAssets.length) {
                console.log("new Assets: " + JSON.stringify(newAssets))
            }
            
            await createBulkAssets(newAssets);

            newLastSyncedBlock = toBlock;
        }

        const syncReq = setTimeout(() => {
            this.syncAssets({
                ...options,
                lastSyncedBlock: newLastSyncedBlock,
            });
        }, syncInterval);

        this.networks.set(networkId, {
            ...syncNetwork,
            syncing: false,
            syncReq,
            lastSyncedBlock: newLastSyncedBlock,
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
        await this.syncAssets({
            networkId,
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
