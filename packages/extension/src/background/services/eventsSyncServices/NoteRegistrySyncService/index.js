import {
    errorLog,
} from '~utils/log';
import Asset from '~background/database/models/asset';
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

    const lastSyncedAsset = await Asset.latest({byField: 'blockNumber'})

    if (lastSyncedAsset) {
        lastSyncedBlock = lastSyncedAsset.blockNumber;
    }
    
    manager.sync({
        networkId,
        lastSyncedBlock,
    });
};

export default {
    set: config => manager.setConfig(config),
    syncCreateNoteRegistries,
    manager,
};
