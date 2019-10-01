import {
    log,
    warnLog,
    errorLog,
} from '~utils/log';
import Web3Service from '../../../Web3Service';
import {
    syncedAssets,
} from '../../utils/asset';
import AssetsSyncManagerFactory from '../AssetsSyncManager/factory';
import {
    fetchNotes,
    subscription as NoteSubscription,
    saveNotes,
} from '../../utils/note';
import {
    saveAccessesFromNotes,
} from '../../utils/access';

/* See more details about limitation
 * https://infura.io/docs/ethereum/json-rpc/eth_getLogs
*/
const infuraLimitError = {
    code: -32005,
    message: 'query returned more than 10000 results',
};

const assetsSyncManager = networkId => AssetsSyncManagerFactory.create(networkId);

class SyncManager {
    constructor() {
        this.config = {
            blocksPerRequest: 540000, // ~ per 3 months (~6000 per day)
            precisionDelta: 10, //
        };
        this.addresses = new Map();
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

    isInQueue(address) {
        const syncAddress = this.addresses.get(address);
        return !!(syncAddress
            && (syncAddress.syncing || syncAddress.subscription)
        );
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync CreateNote / UpdateMetadata / DestroyNote with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = async (address, prevState = {}) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`NotesSyncManager syncing with "${address}" eth address is not in process.`);
            return;
        }

        const {
            subscription,
        } = syncAddress;

        if (subscription) {
            const {
                error: unsubscribeError,
            } = await NoteSubscription.unsubscribe(subscription);

            if (unsubscribeError) {
                errorLog(`Pause error in NotesSyncManager. Can't unsubscribe from sockets for address ${address}.`);
                return;
            }
        }

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: prevState,
        });
    };

    resume = (address) => {
        const syncAddress = this.addresses.get(address);
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

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: null,
        });

        this.syncNotes({
            ...pausedState,
            address,
        });
    };

    syncProgress = async (address) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`NotesSyncManager syncing with "${address}" eth address is not in process.`);
            return null;
        }
        const {
            lastSyncedBlock,
            networkId,
            subscription,
        } = syncAddress;

        const blocks = await Web3Service(networkId).eth.getBlockNumber();
        const synced = subscription ? 'latest' : lastSyncedBlock;

        return {
            blocks,
            lastSyncedBlock: synced,
        };
    };

    setProgressCallback = (callback) => {
        this.progressSubscriber = callback;
    };

    async subscribeOnNewNotes(options) {
        const {
            address,
            lastSyncedBlock,
            fromAssets,
            networkId,
        } = options;

        const subscription = await NoteSubscription.subscribe({
            fromBlock: lastSyncedBlock + 1,
            fromAssets,
            networkId,
        });

        const syncAddress = this.addresses.get(address);
        this.addresses.set(address, {
            ...syncAddress,
            subscription,
        });

        let newLastSyncedBlock = lastSyncedBlock;

        subscription.onData(async (groupedNotes) => {
            if (groupedNotes.isEmpty()) {
                return;
            }
            await Promise.all([
                saveNotes(groupedNotes, networkId),
                saveAccessesFromNotes(groupedNotes, networkId),
            ]);
            newLastSyncedBlock = groupedNotes.lastBlockNumber() || newLastSyncedBlock;
            this.syncConfig = {
                ...this.syncConfig,
                lastSyncedBlock: newLastSyncedBlock,
            };
        });

        subscription.onError(async (error) => {
            this.handleFetchError(error);
        });
    }

    async syncNotes(options) {
        const {
            address,
            lastSyncedBlock,
            networkId,
        } = options;

        const syncAddress = this.addresses.get(address);
        const {
            pausedState,
            subscription: prevSubscription,
        } = syncAddress;
        if (pausedState) {
            return;
        }
        if (this.paused) {
            await this.pause(address, options);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            syncing: true,
            subscription: null,
        });

        const {
            precisionDelta,
            blocksPerRequest,
        } = this.config;

        if (prevSubscription) {
            const {
                error: unsubscribeError,
            } = await NoteSubscription.unsubscribe(prevSubscription);

            if (unsubscribeError) {
                errorLog(`NotesSyncManager can't unsubscribe from sockets for address ${address}.`);
                return;
            }
        }

        const assetsManager = assetsSyncManager(networkId);
        const {
            blocks,
            lastSyncedBlock: lastAssetsBlock,
            isSubscribedOnNewAssets,
        } = assetsManager.syncProgress();
        const currentBlock = isSubscribedOnNewAssets ? blocks : lastAssetsBlock;
        const assets = (await syncedAssets(networkId)).map(({ registryOwner }) => registryOwner);
        const fromBlock = lastSyncedBlock + 1;
        const toBlock = Math.min(fromBlock + blocksPerRequest, currentBlock);

        let newLastSyncedBlock = lastSyncedBlock;
        if (currentBlock > lastSyncedBlock) {
            let shouldLoadNextPortion = currentBlock - fromBlock > precisionDelta;

            const {
                error,
                groupedNotes,
            } = await fetchNotes({
                owner: address,
                fromBlock,
                toBlock,
                fromAssets: assets,
                networkId,
            });

            if (groupedNotes) {
                const promises = [
                    saveNotes(groupedNotes, networkId),
                    saveAccessesFromNotes(groupedNotes, networkId),
                ];
                await Promise.all(promises);
                newLastSyncedBlock = toBlock;

                if (this.progressSubscriber) {
                    this.progressSubscriber({
                        blocks: currentBlock,
                        lastSyncedBlock: newLastSyncedBlock,
                    });
                }
            } else if (error && error.code === infuraLimitError.code) {
                this.config = {
                    ...this.config,
                    blocksPerRequest: blocksPerRequest / 2,
                };
                shouldLoadNextPortion = true;
            } else {
                this.handleFetchError(error);
            }

            if (shouldLoadNextPortion) {
                this.addresses.set(address, {
                    ...syncAddress,
                    lastSyncedBlock: newLastSyncedBlock,
                });

                await this.syncNotes({
                    ...options,
                    lastSyncedBlock: newLastSyncedBlock,
                });
                return;
            }
        }

        this.addresses.set(address, {
            ...syncAddress,
            syncing: false,
            lastSyncedBlock: newLastSyncedBlock,
        });

        this.subscribeOnNewNotes({
            address,
            fromAssets: assets,
            lastSyncedBlock: newLastSyncedBlock,
            networkId,
        });
    }

    async sync({
        address,
        lastSyncedBlock,
        networkId,
    }) {
        log(`Sync notes was started with las synced block: ${lastSyncedBlock} and address: ${address}`);
        let syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            syncAddress = {
                syncing: false,
                subscription: null,
                lastSyncedBlock,
                networkId,
            };
            this.addresses.set(address, syncAddress);
        }
        return this.syncNotes({
            address,
            lastSyncedBlock,
            networkId,
        });
    }

    restartAllSyncing() {
        this.addresses.forEach((syncAddress, address) => {
            const {
                lastSyncedBlock,
                networkId,
            } = syncAddress;

            this.syncNotes({
                address,
                lastSyncedBlock,
                networkId,
            });
        });
    }
}

export default SyncManager;
