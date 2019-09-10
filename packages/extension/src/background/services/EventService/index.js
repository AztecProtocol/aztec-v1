import EventService from './';
import {
    errorLog,
} from '~utils/log';
import Note from '~background/database/models/note';
import Account from '~background/database/models/account';
import NotesSyncManager from './helpers/NotesSyncManager';
import AssetsSyncManager from './helpers/AssetsSyncManager';
import {
    START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';
import fetchAccount from './utils/fetchAccount';


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

    const lastSyncedAsset = await Asset.latest()

    //TODO: Improve this for each network separately
    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;

    if (lastSyncedAsset) {
        lastSyncedBlock = lastSyncedAsset.blockNumber;
    }
    
    assetsSyncManager.sync({
        networkId,
        lastSyncedBlock,
    });
};

const syncNotes = async ({
    address,
    networkId = 0
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
    const lastSyncedNote = await Note.latest(options);

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

const getLatestMetaData = async ({
    noteHash, 
    networkId = 0,
}) => {
    
};

const fetchAztecAccount = async ({
    address, 
    networkId = 0
}) => {
    const options = {
        filterOptions: { address },
    };

    const account = await Account.latest(options);
    if (account) {
        return { error: null, account };
    }

    const {
        error,
        accounts: newAccounts,
    } = await fetchAccount({
        address
    });

    if (newAccounts.length) {
        await createBulkAccounts(newAccounts);
        return { error, account: Account.latest(options) };
    }

    return { error,  account: null };
};

export default {
    set: config => {
        notesSyncManager.setConfig(config);
        assetsSyncManager.setConfig(config);
    },
    syncAssets,
    syncNotes,
    getLatestMetaData,
    fetchAztecAccount,
    
    notesSyncManager,
    assetsSyncManager,
};
