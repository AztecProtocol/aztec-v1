import {
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../../Web3Service'
import {
    fetchNotes
} from '../utils/fetchNotes';
import {
    saveNotes
} from '../utils/saveNotes';

/* See more details about limitation
 * https://infura.io/docs/ethereum/json-rpc/eth_getLogs
*/
const infuraLimitError =  {
    'code': -32005,
    'message': 'query returned more than 10000 results',
}

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
            blocksPerRequest: 45000, // ~ per week (~6000 per day)
            precisionDelta: 10 // 
        };
        this.networks = new Map(); 
        // this.addresses = new Map();
        this.paused = false;
    };

    _ensureSyncOptions(networkId) {
        const addresses = this.networks.get(networkId);
        if(!addresses) {
            this.networks.set(networkId, new Map());
        }
    }

    getSyncOptions(networkId) {
        this._ensureSyncOptions();
        const addresses = this.networks.get(networkId);
        return {
            forAddress: (address) => {
                return addresses.get(address);
            },
        }
    };

    setSyncOptions(options, networkId) {
        this._ensureSyncOptions();
        return {
            toAddress: (address) => {
                this.networks.get(networkId).set(address, options);
            },
        }
    };

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    };

    isInQueue(address, networkId) {
        const syncAddress = this.getSyncOptions(networkId).forAddress(address);
        return !!(syncAddress
            && (syncAddress.syncing || syncAddress.syncReq)
        );
    };

    handleFetchError = (error) => {
        errorLog('Failed to sync CreateNote / UpdateMetadata / DestroyNote with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (address, prevState = {}) => {
        const { networkId } = prevState;
        const syncAddress = this.getSyncOptions(networkId).forAddress(address);
        if (!syncAddress) {
            warnLog(`NotesSyncManager syncing with "${address}" eth address is not in process.`);
            return;
        }
        this.setSyncOptions({
            ...syncAddress,
            pausedState: prevState,
        }, networkId).toAddress(address);
    };

    resume = (address, networkId) => {
        const syncAddress = this.getSyncOptions(networkId).forAddress(address);
        if (!syncAddress) {
            warnLog(`NotesSyncManager syncing with "${address}" eth address is not in process.`);
            return;
        }

        const {
            pausedState,
        } = syncAddress;
        if (!pausedState) {
            warnLog(`NotesSyncManager with ${address} eth address is already running.`);
            return;
        }
        
        this.setSyncOptions({
            ...syncAddress,
            pausedState: null,
        }, networkId).toAddress(address);

        this.syncNotes({
            ...pausedState,
            address,
        });
    };

    async syncNotes(options) {
        const {
            address,
            lastSyncedBlock,
            networkId,
        } = options;

        const syncAddress = this.getSyncOptions(networkId).forAddress(address);

        if (syncAddress.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(address, options);
            return;
        }

        this.setSyncOptions({
            ...syncAddress,
            syncing: true,
            syncReq: null,
        }, networkId).toAddress(address);

        const {
            syncReq: prevSyncReq,
        } = syncAddress;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            syncInterval,
            precisionDelta,
            blocksPerRequest,
        } = this.config;

        const currentBlock = await Web3Service.eth.getBlockNumber();
        let newLastSyncedBlock = lastSyncedBlock;

        if(currentBlock > lastSyncedBlock) {
            const fromBlock = lastSyncedBlock + 1;
            const toBlock = Math.min(fromBlock + blocksPerRequest, currentBlock);
            let shouldLoadNextPortion = currentBlock - fromBlock > precisionDelta;

            const { 
                error, 
                groupedNotes 
            } = await fetchNotes({
                owner: address,
                fromBlock,
                toBlock,
                networkId,
            });

            if(!groupedNotes.isEmpty()) {
                await saveNotes(groupedNotes, networkId);
                newLastSyncedBlock = toBlock;

            } else if (error && error.code === infuraLimitError.code) {
                newLastSyncedBlock = parseInt(fromBlock + toBlock / 2);
                shouldLoadNextPortion = true;

            } else {
                this.handleFetchError(error);
            }

            if (shouldLoadNextPortion) {
                await this.syncNotes({
                    ...options,
                    lastSyncedBlock: newLastSyncedBlock,
                });
                return;
            }
        }

        const syncReq = setTimeout(() => {
            this.syncNotes({
                ...options,
                lastSyncedBlock: newLastSyncedBlock,
            });
        }, syncInterval);

        this.setSyncOptions({
            ...syncAddress,
            syncing: false,
            syncReq,
            lastSyncedBlock: newLastSyncedBlock,
        }, networkId).toAddress(address);
    };

    async sync({
        address,
        lastSyncedBlock,
        networkId,
    }) {
        let syncAddress = this.getSyncOptions(networkId).forAddress(address);
        
        if (!syncAddress) {
            syncAddress = {
                syncing: false,
                syncReq: null,
                lastSyncedBlock,
            };
            this.setSyncOptions(syncAddress, networkId).toAddress(address);
        }
        return this.syncNotes({
            address,
            lastSyncedBlock,
            networkId,
        });
    };
}

export default SyncManager;
