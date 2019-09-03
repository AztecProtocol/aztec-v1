import {
    errorLog,
} from '~utils/log';
import note from '~background/database/models/note';
import Account from '~background/database/models/account';
import SyncManager from './helpers/SyncManager';
import {
    START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

const manager = new SyncManager();

const syncEthAddress = async ({
    address,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in NoteSyncService.syncEthAddress()");
        return;
    }

    if (manager.isInQueue(address)) {
        return;
    }

    const filterFunc = obj => obj.address === obj.address
    const lastSyncedNote = await note.latest({byField: 'blockNumber', filterFunc})
    const account = await Account.latest({byField: 'blockNumber', filterFunc})

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    if (lastSyncedNote) {
        lastSyncedBlock = lastSyncedNote.blockNumber;
        
    } else if (account) {
        lastSyncedBlock = account.blockNumber;
    }

    manager.sync({
        address,
        lastSyncedBlock,
    });

};

export default {
    set: config => manager.setConfig(config),
    syncEthAddress,
};
