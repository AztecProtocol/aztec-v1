import {
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../../../Web3Service'
import fetchNotes from '../utils/fetchNotes';
import saveNotes from '../utils/saveNotes';
import associatedNotesWithOwner from '../utils/associatedNotesWithOwner';

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
            blocksPerRequest: 45000, // ~ per week (~6000 per day)
            precisionDelta: 10 // 
        };
        this.addresses = new Map();
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

    isInQueue(address) {
        const syncAddress = this.addresses.get(address);
        return !!(syncAddress
            && (syncAddress.syncing || syncAddress.syncReq)
        );
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync RegisterExtension with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (address, prevState = {}) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`RegisterExtension syncing with "${address}" eth address is not in process.`);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: prevState,
        });
    };

    resume = (address) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`RegisterExtension syncing with "${address}" eth address is not in process.`);
            return;
        }

        const {
            pausedState,
        } = syncAddress;
        if (!pausedState) {
            warnLog(`RegisterExtension with ${address} eth address is already running.`);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: null,
        });

        this.syncNotes({
            ...pausedState,
            address,
        });
    };

    async syncNotes(options) {
        const {
            address,
            lastSyncedBlock,
        } = options;

        const syncAddress = this.addresses.get(address);
        if (syncAddress.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(address, options);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            syncing: true,
            syncReq: null,
        });

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
            const loadNextPortion = currentBlock - fromBlock > precisionDelta;

            let notes = await fetchNotes({
                fromBlock,
                toBlock,
                onError: this.handleFetchError,
            });

            notes = associatedNotesWithOwner(notes, address);
    
            await saveNotes(notes);
            
            newLastSyncedBlock = toBlock;
    
            if (loadNextPortion) {
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

        this.addresses.set(address, {
            ...syncAddress,
            syncing: false,
            syncReq,
            lastSyncedBlock: newLastSyncedBlock,
        });
    }

    async sync({
        address,
        lastSyncedBlock,
    }) {
        let syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            syncAddress = {
                syncing: false,
                syncReq: null,
                lastSyncedBlock,
            };
            this.addresses.set(address, syncAddress);
        }
        return this.syncNotes({
            address,
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
