import {
    errorLog,
} from '~utils/log';
import createNoteRegistry from '~background/database/models/createNoteRegistry';
import SyncManager from './helpers/SyncManager';
import {
    START_EVENTS_SYNCING_BLOCK,
} from '~config/constants';

const manager = new SyncManager();

const syncCreateNoteRegistries = async ({
    networkId,
}) => {
    if (networkId === undefined) {
        errorLog("'networkId' can not be empty in NoteRegistrySyncService.syncCreateNoteRegistries()");
        return;
    }

    if (manager.isInQueue(networkId)) {
        return;
    }

    //TODO: Improve this for each network separately
    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;

    const lastSyncedNoteRegistry = await createNoteRegistry.latest({byField: 'blockNumber'})

    if (lastSyncedNoteRegistry) {
        lastSyncedBlock = lastSyncedNoteRegistry.blockNumber;
    }
    
    manager.sync({
        networkId,
        lastSyncedBlock,
    });
};

export default {
    set: config => manager.setConfig(config),
    syncCreateNoteRegistries,
};
