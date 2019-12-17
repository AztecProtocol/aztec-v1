import {
    warnLog,
    errorLog,
} from '~/utils/log';
import Web3Service from '~/helpers/Web3Service';
import {
    fetchNotes,
    saveNotes,
} from '../../utils/note';

/* See more details about limitation
 * https://infura.io/docs/ethereum/json-rpc/eth_getLogs
 */

const infuraLimitError = {
    code: -32005,
    message: 'query returned more than 10000 results',
};

const isInfuraLimitError = error => error && error.code === infuraLimitError.code;

const SYNCING_STATUS = {
    ACTIVE: 'ACTIVE',
    SHOULD_LOAD_NEXT_PORTION: 'SHOULD_LOAD_NEXT_PORTION',
    RETRY: 'RETRY',
    FINISHED: 'FINISHED',
    FAILED: 'FAILED',
};

class SyncManager {
    constructor() {
        this.config = {
            blocksPerRequest: 540000, // ~ per 3 months (~6000 per day)
            precisionDelta: 10, //
            maxNumberOfAttempts: 5,
            networkId: null,
        };
        this.addresses = new Map();
    }

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
        const {
            networkId,
        } = this.config;
        if (!networkId && networkId !== 0) {
            errorLog('Dont passed networkId into NotesSyncManager configuration');
        }
    }

    increaseBlocksPerRequest(byCount = this.config.blocksPerRequest * 1.5) {
        const {
            blocksPerRequest,
        } = this.config;

        this.config = {
            ...this.config,
            blocksPerRequest: blocksPerRequest + parseInt(byCount, 10),
        };
    }

    decreaseBlocksPerRequest(byCount = -this.config.blocksPerRequest * 0.5) {
        const {
            blocksPerRequest,
        } = this.config;

        this.config = {
            ...this.config,
            blocksPerRequest: blocksPerRequest + parseInt(byCount, 10),
        };
    }

    isInQueue({
        address,
        assetAddress,
    }) {
        const syncAddress = this.addresses.get(address);
        const {
            syncDetails = {},
        } = syncAddress || {};

        return syncDetails[assetAddress] && syncDetails[assetAddress].syncing;
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync CreateNote / UpdateMetadata / DestroyNote with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };


    stop = ({
        address,
        assetsAddresses,
    }) => {
        if (!assetsAddresses || !assetsAddresses.length) {
            warnLog(`NotesSyncManager cannot stop assets with addresses "${JSON.stringify(assetsAddresses)}".`);
            return;
        }

        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`NotesSyncManager syncing with "${address}" eth address is not in process.`);
            return;
        }
        const {
            syncDetails,
        } = syncAddress;

        const updatedSyncDetails = {
            ...syncDetails,
        };
        assetsAddresses.forEach((assetAddress) => {
            if (updatedSyncDetails[assetAddress]) {
                updatedSyncDetails[assetAddress].syncing = false;
            }
        });

        this.addresses.set(address, {
            ...syncAddress,
            syncDetails: updatedSyncDetails,
        });
    };

    async syncNotes(options) {
        const {
            address,
            lastSyncedBlock,
            assets,
            progressCallbacks,
            retriedNumber = 0,
        } = options;

        const syncAddress = this.addresses.get(address);
        const {
            syncDetails,
        } = syncAddress;

        const fromAssets = assets
            .filter(({ registryOwner }) => syncDetails[registryOwner].syncing);
        const fromAssetsAddresses = fromAssets.map(({ registryOwner }) => registryOwner);
        if (!fromAssets.length) { return; }

        const {
            precisionDelta,
            blocksPerRequest,
            networkId,
            maxNumberOfAttempts,
        } = this.config;

        const {
            onCompleate,
            onProggressChange,
            onFailure,
        } = progressCallbacks;
        const currentBlock = await Web3Service.eth.getBlockNumber();
        const fromBlock = lastSyncedBlock + 1;
        const toBlock = Math.min(fromBlock + blocksPerRequest, currentBlock);

        let newLastSyncedBlock = lastSyncedBlock;
        let status = null;

        if (currentBlock > lastSyncedBlock + precisionDelta) {
            const {
                error,
                groupedNotes,
            } = await fetchNotes({
                owner: address,
                fromBlock,
                toBlock,
                fromAssets: fromAssetsAddresses,
                networkId,
            });

            let newRetriedNumber = retriedNumber;
            if (groupedNotes) {
                newLastSyncedBlock = toBlock;
                newRetriedNumber = 0;

                if (!groupedNotes.isEmpty()) {
                    await saveNotes(groupedNotes, networkId);
                } else {
                    this.increaseBlocksPerRequest();
                }

                if (currentBlock - newLastSyncedBlock > precisionDelta) {
                    status = SYNCING_STATUS.SHOULD_LOAD_NEXT_PORTION;
                } else {
                    status = SYNCING_STATUS.FINISHED;
                }

                const updatedSyncDetails = {};
                fromAssets.forEach(({ registryOwner }) => {
                    updatedSyncDetails[registryOwner] = {
                        ...syncDetails[registryOwner],
                        lastSyncedBlock: newLastSyncedBlock,
                    };
                });

                this.addresses.set(address, {
                    ...syncAddress,
                    syncDetails: {
                        ...syncDetails,
                        ...updatedSyncDetails,
                    },
                });

                if (onProggressChange) {
                    onProggressChange({
                        blocks: currentBlock,
                        lastSyncedBlock: newLastSyncedBlock,
                        assets: fromAssets,
                    });
                }
            } else if (isInfuraLimitError(error)) {
                this.decreaseBlocksPerRequest();
                status = SYNCING_STATUS.RETRY;
            } else {
                status = SYNCING_STATUS.RETRY;
                if (maxNumberOfAttempts >= retriedNumber) {
                    newRetriedNumber += 1;
                } else {
                    const updatedSyncDetails = {};
                    fromAssets.forEach(({ registryOwner }) => {
                        updatedSyncDetails[registryOwner] = {
                            ...syncDetails[registryOwner],
                            syncing: false,
                        };
                    });

                    this.addresses.set(address, {
                        ...syncAddress,
                        syncDetails: {
                            ...syncDetails,
                            ...updatedSyncDetails,
                        },
                    });
                    onFailure({
                        blocks: currentBlock,
                        lastSyncedBlock: newLastSyncedBlock,
                        assets: fromAssets,
                        error,
                    });
                }
            }

            if ([SYNCING_STATUS.RETRY, SYNCING_STATUS.SHOULD_LOAD_NEXT_PORTION].includes(status)) {
                await this.syncNotes({
                    ...options,
                    assets: fromAssets,
                    lastSyncedBlock: newLastSyncedBlock,
                    progressCallbacks,
                    retriedNumber: newRetriedNumber,
                });
                return;
            }
        } else {
            status = SYNCING_STATUS.FINISHED;
        }

        if (status === SYNCING_STATUS.FINISHED) {
            const updatedSyncDetails = {
                ...syncDetails,
            };

            fromAssets.forEach(({ registryOwner }) => {
                delete updatedSyncDetails[registryOwner];
            });

            this.addresses.set(address, {
                ...syncAddress,
                syncDetails: updatedSyncDetails,
            });

            onCompleate({
                blocks: currentBlock,
                lastSyncedBlock: newLastSyncedBlock,
                assets: fromAssets,
            });
        }
    }

    async sync({
        address,
        assets,
        syncedBlocks = {},
        progressCallbacks = {},
    }) {
        const syncAddress = this.addresses.get(address);
        const {
            syncDetails: prevSyncDetails = {},
        } = syncAddress || {};

        const nonExistingAssets = assets.filter(({ registryOwner }) => !this.isInQueue({
            address,
            assetAddress: registryOwner,
        }));

        if (!nonExistingAssets.length) {
            return null;
        }

        const syncDetails = {
            ...prevSyncDetails,
        };

        let lowestSyncedBlock;
        for (let i = 0; i < nonExistingAssets.length; i += 1) {
            const {
                registryOwner,
                blockNumber: assetRegisteredAtBlock,
            } = nonExistingAssets[i];
            const lastSyncedBlock = syncedBlocks[registryOwner] || assetRegisteredAtBlock;

            // eslint-disable-next-line max-len
            lowestSyncedBlock = lowestSyncedBlock ? Math.min(lowestSyncedBlock, lastSyncedBlock) : lastSyncedBlock;

            syncDetails[registryOwner] = {
                syncing: true,
                lastSyncedBlock,
            };
        }

        this.addresses.set(address, {
            ...syncAddress,
            syncDetails,
        });

        return this.syncNotes({
            address,
            assets: nonExistingAssets,
            lastSyncedBlock: lowestSyncedBlock,
            progressCallbacks,
        });
    }
}

export default SyncManager;
