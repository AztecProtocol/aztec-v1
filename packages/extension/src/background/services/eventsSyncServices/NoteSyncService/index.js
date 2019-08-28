import {
    errorLog,
} from '~utils/log';
import note from '~background/database/models/note';
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

    const ownerFilter = obj => obj.address === obj.address
    const lastSyncedNote = await note.latest({byField: 'blockNumber', ownerFilter})
    const registeredExtension = await registerExtension.latest({byField: 'blockNumber', ownerFilter})

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    if (lastSyncedNote) {
        lastSyncedBlock = lastSyncedNote.blockNumber;
        
    } else if (registeredExtension) {
        lastSyncedBlock = registeredExtension.blockNumber;
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
