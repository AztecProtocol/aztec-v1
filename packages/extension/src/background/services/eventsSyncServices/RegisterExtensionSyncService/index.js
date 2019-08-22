import {
    errorLog,
} from '~utils/log';
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
        errorLog("'address' can not be empty in RegisterExtensionSyncService.syncEthAddress()");
        return;
    }

    if (manager.isInQueue(address)) {
        return;
    }

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    const registeredExtension = await registerExtension.query(obj => obj.address === obj.address);

    if (registeredExtension && registeredExtension.length) {
        lastSyncedBlock = registeredExtension[registeredExtension.length - 1].blockNumber + 1;
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
