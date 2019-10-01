import {
    errorLog,
} from '~utils/log';
import NotesSyncManagerFactory from './helpers/NotesSyncManager/factory';
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
}) => {
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
    });
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

    syncAssets({
        networkId,
    });

    const manager = notesSyncManager(networkId);

    if (manager.isInQueue(address)) {
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

    const options = {
        filterOptions: {
            owner: address,
        },
    };

    const lastSyncedNote = await Note.latest({ networkId }, options);

    let lastSyncedBlock;
    if (lastSyncedNote) {
        lastSyncedBlock = lastSyncedNote.blockNumber;
    } else {
        lastSyncedBlock = account.blockNumber;
    }

    manager.sync({
        address,
        lastSyncedBlock,
        networkId,
    });
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
        const allNotes = [
            ...groupedNotes.createNotes,
            ...groupedNotes.updateNotes,
            ...groupedNotes.destroyNotes,
        ];

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
