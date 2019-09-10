import EventService from './';
import {
    errorLog,
} from '~utils/log';
import NotesSyncManager from './helpers/NotesSyncManager';
import AssetsSyncManager from './helpers/AssetsSyncManager';
import {
    START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';
import { 
    fetchAccount,
} from './utils/fetchAccount';
import {
    fetchNotes,
} from './utils/fetchNotes';
import {
    createAccount,
} from './utils/account'
import Note from '~background/database/models/note';
import Account from '~background/database/models/account';
import Asset from '~background/database/models/asset';


const notesSyncManager = new NotesSyncManager();
const assetsSyncManager = new AssetsSyncManager();


const syncAssets = async ({
    networkId = 0,
}) => {
    if (networkId === undefined) {
        errorLog("'networkId' can not be empty in EventService.syncAssets()");
        return;
    }

    if (assetsSyncManager.isInQueue(networkId)) {
        return;
    }

    const lastSyncedAsset = await Asset.latest(null, {networkId})

    //TODO: Improve this for each network separately
    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;

    if (lastSyncedAsset) {
        lastSyncedBlock = lastSyncedAsset.blockNumber;
    }
    
    assetsSyncManager.sync({
        lastSyncedBlock,
        networkId,
    });
};

const syncNotes = async ({
    address,
    networkId
}) => {
    if (!address) {
        errorLog("'address' can not be empty in EventService.syncEthAddress()");
        return;
    }

    if (notesSyncManager.isInQueue(address)) {
        return;
    }

    const {
        error, 
        account,
    } = await EventService.fetchAztecAccount(address);

    if (error) {
        errorLog(`Error syncing address: ${address}. Error: ${error.errorMessage}.`);
        return;
    }
    
    if (!account) {
        errorLog(`Error syncing address: ${address}. Cannot find an account.`);
        return;
    }

    const options = {
        filterOptions: { address },
    };
    const lastSyncedNote = await Note.latest(options, {networkId});

    let lastSyncedBlock;
    if (lastSyncedNote) {
        lastSyncedBlock = lastSyncedNote.blockNumber;
        
    } else {
        lastSyncedBlock = account.blockNumber;
    }

    notesSyncManager.sync({
        address,
        lastSyncedBlock,
    });

};

const fetchLatestNote = async ({
    noteHash,
    assetAddress,
    networkId = 0,
}) => {

    let fromAssets;
    if (assetAddress) {
        fromAssets = [assetAddress];

    } else if(!assetsSyncManager.isSynced(networkId)) {
        return {
            error: new Error(`Error: assets are not synced for networkId: ${networkId}`),
            note: null,
        };

    } else {
        fromAssets = (await Asset.query({networkId})
            .toArray())
            .map(({registryOwner}) => registryOwner);
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

const fetchAztecAccount = async ({
    address, 
    networkId = 0
}) => {
    const options = {
        filterOptions: { address },
    };

    const account = await Account.latest(options, {networkId});
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
        address
    });

    if (newAccount) {
        await createAccount(newAccount);
        const latestAccount = await Account.latest(options, {networkId});
        
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

export default {
    set: config => {
        notesSyncManager.setConfig(config);
        assetsSyncManager.setConfig(config);
    },
    syncAssets,
    syncNotes,
    fetchLatestNote,
    fetchAztecAccount,
    
    notesSyncManager,
    assetsSyncManager,
};
