import {
    warnLog,
    errorLog,
} from '~utils/log';
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
        errorLog("'address' can not be empty in AccountSyncService.syncEthAddress()");
        return;
    }

    if (manager.isInQueue(address)) {
        warnLog(`${address} address already in the queue AccountSyncService.syncEthAddress()`);
        return;
    }

    const filterFunc = obj => obj.address === obj.address
    const account = await Account.latest({byField: 'blockNumber', filterFunc})

    let lastSyncedBlock = START_EVENTS_SYNCING_BLOCK;
    if (account) {
        lastSyncedBlock = account.blockNumber;
    }

    console.log(`Params for sync account: ${JSON.stringify({
        address,
        lastSyncedBlock,
    })}`);

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
