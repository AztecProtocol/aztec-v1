import {
    errorLog,
} from '~utils/log';
// import note from '~background/database/models/registerExtension';
import registerExtension from '~background/database/models/registerExtension';
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

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    
    //TODO: Implement
    const lastSyncedNote = null;
    const registeredExtension = await registerExtension.query(obj => obj.address === obj.address);

    if (lastSyncedNote) {
        lastSyncedBlock = lastSyncedNote.blockNumber;
        
    } else if (registeredExtension && registeredExtension.length) {
        lastSyncedBlock = registeredExtension[registeredExtension.length - 1].blockNumber;
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
