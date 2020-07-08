import {
    log,
    warnLog,
    errorLog,
} from '~/utils/log';
import Web3Service from '~/helpers/Web3Service';
import {
    createBulkAssets,
    fetchAssets,
} from '../../utils/asset';
import EventSubscription from '../../utils/asset/subscription';

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
            blocksPerRequest: 50, // ~ per 3 months (~6000 per day)
            precisionDelta: 10, //
            maxNumberOfAttempts: 5,
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
            warnLog('Assets syncing with is not in process.');
            return;
        }

        this.syncConfig = {
            ...this.syncConfig,
            pausedState: prevState,
        };
    };

    isInProcess() {
        const config = this.syncConfig;
        return !!(config
            && (config.syncing || config.subscription)
        );
    }

    syncProgress = async () => {
        if (!this.syncConfig) {
            warnLog('Assets syncing is not in process.');
            return null;
        }
        const {
            lastSyncedBlock,
            pausedState,
            subscription,
        } = this.syncConfig;

        const blocks = await Web3Service.eth.getBlockNumber();
        const isSubscribedOnNewAssets = !!subscription && !pausedState;

        return {
            blocks,
            lastSyncedBlock,
            isSubscribedOnNewAssets,
        };
    };

    setProgressCallback = (callback) => {
        this.progressSubscriber = callback;
    };

    resume = () => {
        if (!this.syncConfig) {
            warnLog('Assets syncing is not in process.');
            return;
        }

        const {
            pausedState,
        } = this.syncConfig;
        if (!pausedState) {
            warnLog('Assets syncing is already running.');
            return;
        }

        this.syncConfig = {
            ...this.syncConfig,
            pausedState: null,
        };

        this.syncAssets({
            ...pausedState,
        });
    };

    isSynced = () => {
        if (!this.syncConfig) {
            warnLog('Assets syncing is not in process.');
            return null;
        }

        const {
            syncing,
        } = this.syncConfig;
        return !syncing;
    }

    async subscribeOnNewAsset(options) {
        const {
            lastSyncedBlock,
        } = options;

        const {
            networkId,
            subscriberOnNewAssets,
        } = this.syncConfig;

        const subscription = await EventSubscription.subscribe({
            fromBlock: lastSyncedBlock + 1,
            networkId,
        }, (error) => {
            if (error) {
                errorLog(error);
            }
        });

        this.syncConfig = {
            ...this.syncConfig,
            subscription,
        };

        subscription.onData(async (asset) => {
            log(`WebSockets received asset: ${JSON.stringify(asset)}`);
            await createBulkAssets([asset], networkId);
            this.syncConfig = {
                ...this.syncConfig,
                lastSyncedBlock: asset.blockNumber,
            };
            if (subscriberOnNewAssets) {
                subscriberOnNewAssets([asset]);
            }
        });

        subscription.onError(async (error) => {
            this.handleFetchError(error);
        });
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
            ...this.syncConfig,
            syncing: true,
        };

        const {
            networkId,
            subscriberOnNewAssets,
        } = this.syncConfig;

        const currentBlock = await Web3Service.eth.getBlockNumber();
        let newLastSyncedBlock = lastSyncedBlock;
        const fromBlock = lastSyncedBlock + 1;
        const toBlock = currentBlock;

        if (currentBlock > lastSyncedBlock) {
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
                if (this.progressSubscriber) {
                    this.progressSubscriber({
                        blocks: currentBlock,
                        lastSyncedBlock: newLastSyncedBlock,
                    });
                }
                if (subscriberOnNewAssets && newAssets.length) {
                    subscriberOnNewAssets(newAssets);
                }
            }
        }

        this.syncConfig = {
            ...this.syncConfig,
            syncing: false,
            lastSyncedBlock: newLastSyncedBlock,
        };

        this.subscribeOnNewAsset({
            lastSyncedBlock: newLastSyncedBlock,
        });
    }

    async sync({
        lastSyncedBlock,
        networkId,
    }, subscriberOnNewAssets) {
        if (!this.syncConfig) {
            this.syncConfig = {
                syncing: false,
                subscription: null,
                lastSyncedBlock,
                networkId,
                subscriberOnNewAssets,
            };
        }
        await this.syncAssets({
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
