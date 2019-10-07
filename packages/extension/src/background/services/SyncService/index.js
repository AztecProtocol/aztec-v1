import {
    errorLog,
} from '~utils/log';
import userModel from '~database/models/user';
import SyncManager from './helpers/SyncManager';

const manager = new SyncManager();

const syncAccount = async ({
    address,
    privateKey,
    networkId,
    onCompleate,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in SyncService.syncAccount()");
        return;
    }
    if (!privateKey) {
        errorLog("'privateKey' can not be empty in SyncService.syncAccount()");
        return;
    }
    if (!networkId && networkId !== 0) {
        errorLog("'networkId' can not be empty in SyncService.syncAccount()");
        return;
    }

    if (manager.isInQueue(address)) {
        return;
    }

    const user = await userModel.get({
        address,
    });
    if (!user) {
        errorLog(`Account '${address}' has no permission to sync notes from indexedDB.`);
        return;
    }

    const {
        lastSynced,
        blockNumber,
    } = user;

    if (!blockNumber) {
        errorLog(`Account '${address}' is not registered.`);
        return;
    }

    const callbacks = {
        onCompleate,
    };

    manager.sync({
        address,
        privateKey,
        lastSynced,
        blockNumber,
        networkId,
        callbacks,
    });
};

const syncNote = ({
    address,
    noteId,
    networkId,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in SyncService.syncNote()");
        return null;
    }
    if (!noteId) {
        errorLog("'noteId' can not be empty in SyncService.syncNote()");
        return null;
    }
    if (!networkId && networkId !== 0) {
        errorLog("'networkId' can not be empty in SyncService.syncNote()");
        return null;
    }

    if (!manager.isValidAccount(address)) {
        errorLog(`Cannot sync note for user '${address}'`);
        return null;
    }

    return manager.syncNote({
        address,
        noteId,
        networkId,
    });
};

export default {
    set: config => manager.setConfig(config),
    syncAccount,
    syncNote,
};
