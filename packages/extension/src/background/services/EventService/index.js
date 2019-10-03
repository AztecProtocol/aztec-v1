import {
    log,
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

const fetchAztecAccount = async ({
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

const syncAssets = async ({
    networkId,
}, subscriberOnNewAssets) => {
    if (!networkId && networkId !== 0) {
        errorLog("'networkId' can not be empty in EventService.syncAssets()");
        return;
    }
    const manager = assetsSyncManager(networkId);

    if (manager.isInProcess()) {
        return;
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
    }, subscriberOnNewAssets);
};

const syncNotes = async ({
    address,
    networkId,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in EventService.syncEthAddress()");
        return;
    }

    if (!networkId && networkId !== 0) {
        errorLog(`'networkId' can not be ${networkId} in EventService.syncEthAddress()`);
        return;
    }

    const {
        error,
        account,
    } = await fetchAztecAccount({
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
            lastSyncedBlock: note ? note.blockNumber : account.blockNumber,
            assetAddress,
        };
    };

    const onCompleatePulling = ({
        blocks,
        lastSyncedBlock,
        assets,
    }) => {
        log(`Finished pulling (${lastSyncedBlock} from ${blocks} blocks) for assets: ${JSON.stringify(assets)}`);
        watcher.appendAssets({
            address,
            assets,
            lastSyncedBlock,
        });
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
        onProggressChange: onProggressChangePulling,
        onFailure: onFailurePulling,
    };

    const addNewAssetsToSyncNotes = async (assets) => {
        const newAssets = assets.filter(({ registryOwner }) => {
            const options = {
                address,
                assetAddress: registryOwner,
            };
            return !manager.isInQueue(options) && !watcher.isUnderWatching(options);
        });
        if (!newAssets.length) { return; }

        const syncedBlocksPromises = newAssets
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

        manager.sync({
            address,
            assets,
            syncedBlocks,
            progressCallbacks,
        });
    };

    // start sync notes for existing Assets
    const existingAssets = await Asset.query({ networkId }).toArray();
    await addNewAssetsToSyncNotes(existingAssets);

    // start Looking for New Assets
    syncAssets({
        networkId,
    }, addNewAssetsToSyncNotes);
};

const fetchLatestNote = async ({
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

const fetchAsset = async ({
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

export default {
    syncAssets,
    syncNotes,
    fetchLatestNote,
    fetchAztecAccount,
    fetchAsset,
    notesSyncManager,
    assetsSyncManager,
};
