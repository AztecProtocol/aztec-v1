import {
    warnLog,
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
        warnLog(`${address} address already in the queue RegisterExtensionSyncService.syncEthAddress()`);
        return;
    }

    const filterFunc = obj => obj.address === obj.address
    const registeredExtension = await registerExtension.latest({byField: 'blockNumber', filterFunc})

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    if (registeredExtension) {
        lastSyncedBlock = registeredExtension.blockNumber;
    }

    await manager.sync({
        address,
        lastSyncedBlock,
    });
};

export default {
    set: config => manager.setConfig(config),
    syncEthAddress,
    manager,
};
