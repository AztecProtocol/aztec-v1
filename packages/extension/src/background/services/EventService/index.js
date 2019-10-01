import {
    log,
    warnLog,
    errorLog,
} from '~utils/log';
import NotesSyncManagerFactory from './helpers/NotesSyncManager/factory';
import NotesWatcherFactory from './helpers/NotesWatcher/factory';
import AssetsSyncManagerFactory from './helpers/AssetsSyncManager/factory';
import {
    START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';
import {
    createAccount,
    fetchAccount,
} from './utils/account';
import {
    fetchAssets,
    syncedAssets,
} from './utils/asset';
import {
    fetchNotes,
} from './utils/note';
import Note from '~background/database/models/note';
import Account from '~background/database/models/account';
import Asset from '~background/database/models/asset';


const notesSyncManager = networkId => NotesSyncManagerFactory.create(networkId);
const notesWatcher = networkId => NotesWatcherFactory.create(networkId);
const assetsSyncManager = networkId => AssetsSyncManagerFactory.create(networkId);


const AUTOSYNC_STATUS = {
    NOT_STARTED: 'NOT_STARTED',
    STARTED: 'STARTED',
};

class EventService {
    constructor() {
        this.accounts = {};
        this.autosyncConfig = new Map();
    }

    addAccountToSync = async ({
        address,
        networkId,
    }) => {
        if (this.accounts[address]) return;

        const {
            error,
            account,
        } = await this.fetchAztecAccount({
            address,
            networkId,
        });

        if (error) {
            errorLog(`Error syncing address: ${address}. Error: ${error}.`);
            return;
        }

        if (!account) {
            errorLog(`Error syncing address: ${address}. Cannot find an account.`);
            return;
        }
        this.accounts[address] = account;

        const config = this.autosyncConfig.get(networkId) || {};
        if (config.status === AUTOSYNC_STATUS.STARTED) {
            const fromAssets = await this.syncedAssets(networkId);
            this.syncNotes({
                address,
                networkId,
                fromAssets,
            });
        }
    }


    removeAccountFromSyncing = async ({
        address,
        networkId,
    }) => {
        warnLog('TODO: Not implemented yet');
    }

    syncedAssets = async ({
        networkId,
    }) => syncedAssets(networkId);

    fetchAztecAccount = async ({
        address,
        networkId,
    }) => {
        const account = await Account.get({ networkId }, address);

        if (account) {
            return {
                error: null,
                account,
            };
        }

        const {
            error,
            account: newAccount,
        } = await fetchAccount({
            address,
            networkId,
        });

        if (newAccount) {
            await createAccount(newAccount, networkId);
            const latestAccount = await Account.get({ networkId }, address);

            return {
                error: null,
                account: latestAccount,
            };
        }

        return {
            error,
            account: null,
        };
    };

    startAutoSync = async ({
        networkId,
    }) => {
        if (!networkId && networkId !== 0) {
            errorLog("'networkId' can not be empty in EventService.syncAssets()");
            return;
        }
        const config = this.autosyncConfig.get(networkId) || {};
        if (config.status === AUTOSYNC_STATUS.STARTED) return;

        this.syncAssets({
            networkId,
        }, (newAssets) => {
            if (config.status === AUTOSYNC_STATUS.NOT_STARTED) return;
            Object.values(this.accounts).forEach(({ address }) => this.syncNotes({
                address,
                networkId,
                fromAssets: newAssets,
            }));
        });

        this.autosyncConfig.set(networkId, {
            status: AUTOSYNC_STATUS.STARTED,
        });
    }

    stopAutoSync = async ({
        networkId,
    }) => {
        if (!networkId && networkId !== 0) {
            errorLog("'networkId' can not be empty in EventService.syncAssets()");
            return;
        }
        this.autosyncConfig.set(networkId, {
            status: AUTOSYNC_STATUS.NOT_STARTED,
        });
    }

    syncAssets = async ({
        networkId,
    }, assetsHandler) => {
        if (!networkId && networkId !== 0) {
            errorLog("'networkId' can not be empty in EventService.syncAssets()");
            return;
        }
        const manager = assetsSyncManager(networkId);
        if (manager.isInProcess()) {
            return;
        }

        if (assetsHandler) {
            const assets = await this.syncedAssets({ networkId });
            assetsHandler(assets);
        }

        const lastSyncedAsset = await Asset.latest({ networkId });

        // TODO: Improve this for each network separately
        let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;

        if (lastSyncedAsset) {
            lastSyncedBlock = lastSyncedAsset.blockNumber;
        }

        manager.sync({
            lastSyncedBlock,
            networkId,
        }, assetsHandler);
    };


    syncNotes = async ({
        address,
        networkId,
        fromAssets,
        continueWatching = true,
        callbacks = {},
    }) => {
        if (!address) {
            errorLog("'address' can not be empty in EventService.syncEthAddress()");
            return;
        }
        const account = this.accounts[address];
        if (!account) {
            errorLog('Firstly account should be added with help of "addAccountToSync"');
            return;
        }
        if (!networkId && networkId !== 0) {
            errorLog(`'networkId' can not be ${networkId} in EventService.syncEthAddress()`);
            return;
        }
        if (!fromAssets.length) {
            return;
        }

        const manager = notesSyncManager(networkId);
        const watcher = notesWatcher(networkId);

        const latestNoteSyncedBlock = async (assetAddress) => {
            const options = {
                filterOptions: {
                    asset: assetAddress,
                    owner: address,
                },
            };
            const note = await Note.latest({ networkId }, options);
            return {
                lastSyncedBlock: note ? note.blockNumber : 0, // TODO: replace 0 to => account.blockNumber
                assetAddress,
            };
        };

        const onlyNewAssets = fromAssets.filter(({ registryOwner }) => {
            const options = {
                address,
                assetAddress: registryOwner,
            };
            return !manager.isInQueue(options) && !watcher.isUnderWatching(options);
        });
        if (!onlyNewAssets.length) return;

        const syncedBlocksPromises = onlyNewAssets
            .map(({ registryOwner }) => latestNoteSyncedBlock(registryOwner));
        const syncedBlocksArray = await Promise.all(syncedBlocksPromises);
        const syncedBlocks = syncedBlocksArray
            .reduce((acum, info) => {
                const result = {
                    ...acum,
                };
                result[info.assetAddress] = info.lastSyncedBlock;
                return result;
            }, {});

        const onCompleatePulling = (result) => {
            const {
                blocks,
                lastSyncedBlock,
                assets,
            } = result;
            log(`Finished pulling (${lastSyncedBlock} from ${blocks} blocks) for assets: ${JSON.stringify(assets)}`);

            if (continueWatching) {
                watcher.appendAssets({
                    address,
                    assets,
                    lastSyncedBlock,
                });
            }

            if (callbacks.onCompleatePulling) {
                callbacks.onCompleatePulling(result);
            }
        };

        const onProggressChangePulling = ({
            blocks,
            assets,
            lastSyncedBlock,
        }) => {
            log(`Proggress changed (${lastSyncedBlock} from ${blocks} blocks) for pulling for assets: ${JSON.stringify(assets)}`);
        };

        const onFailurePulling = ({
            assets,
            error: pullingError,
        }) => {
            errorLog(`Error occured for pulling notes for assets: ${JSON.stringify(assets)}`, pullingError);
        };

        const progressCallbacks = {
            onCompleate: onCompleatePulling,
            onProggressChange: callbacks.onProggressChangePulling || onProggressChangePulling,
            onFailure: callbacks.onFailurePulling || onFailurePulling,
        };

        manager.sync({
            address,
            assets: fromAssets,
            syncedBlocks,
            progressCallbacks,
        });
    };

    fetchLatestNote = async ({
        noteHash,
        assetAddress,
        networkId,
    }) => {
        let fromAssets;
        const manager = assetsSyncManager(networkId);

        if (assetAddress) {
            fromAssets = [assetAddress];
        } else if (!manager.isSynced(networkId)) {
            return {
                error: new Error(`Error: assets are not synced for networkId: ${networkId}`),
                note: null,
            };
        } else {
            fromAssets = (await Asset.query({ networkId })
                .toArray())
                .map(({ registryOwner }) => registryOwner);
        }

        const {
            error,
            groupedNotes,
        } = await fetchNotes({
            noteHash,
            fromAssets,
            networkId,
        });

        if (!groupedNotes.isEmpty()) {
            const allNotes = groupedNotes.allNotes();
            return {
                error: null,
                note: allNotes[allNotes.length - 1],
            };
        }

        return {
            error,
            note: null,
        };
    };

    fetchAsset = async ({
        address,
        networkId,
    }) => {
        const asset = await Asset.get({ networkId }, { registryOwner: address });

        if (asset) {
            return {
                error: null,
                asset,
            };
        }

        const {
            error,
            assets,
        } = await fetchAssets({
            assetAddress: address,
            networkId,
        });

        return {
            error,
            asset: assets ? assets[assets.length - 1] : null,
        };
    };
}

export default new EventService();
