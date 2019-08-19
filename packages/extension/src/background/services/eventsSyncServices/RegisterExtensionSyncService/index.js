import {
    errorLog,
} from '~utils/log';
import registerExtension from '../mockIndexDB/registerExtension';
import SyncManager from './helpers/SyncManager';

const manager = new SyncManager();

//TODO: Move this value to constants
// It means that block should be set after releasing the app into the production
const PRODUCTION_BLOCK = 0

const syncEthAddress = async ({
    address,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in AccountEventSyncService.syncEthAddress()");
        return;
    }

    if (manager.isInQueue(address)) {
        return;
    }

    let lastSyncedBlock = PRODUCTION_BLOCK;
    const registeredExtension = await registerExtension.get({
        address,
    });
    if (registeredExtension) {
        lastSyncedBlock = registerExtension.lastSyncedBlock + 1;
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
