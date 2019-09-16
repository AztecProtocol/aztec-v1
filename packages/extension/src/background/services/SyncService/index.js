import {
    errorLog,
} from '~utils/log';
import userModel from '~database/models/user';
import SyncManager from './helpers/SyncManager';

const manager = new SyncManager();

const syncAccount = async ({
    address,
    privateKey,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in SyncService.syncAccount()");
        return;
    }
    if (!privateKey) {
        errorLog("'privateKey' can not be empty in SyncService.syncAccount()");
        return;
    }

    if (manager.isInQueue(address)) {
        return;
    }

    const user = await userModel.get({
        address,
    });
    if (!user) {
        errorLog(`Account '${address}' has no permission to sync notes from graph node server.`);
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

    manager.sync({
        address,
        privateKey,
        lastSynced,
        blockNumber,
    });
};

const syncNote = async ({
    address,
    noteId,
}) => {
    if (!address) {
        errorLog("'address' can not be empty in SyncService.syncNote()");
        return null;
    }
    if (!noteId) {
        errorLog("'noteId' can not be empty in SyncService.syncNote()");
        return null;
    }

    if (!manager.isValidAccount(address)) {
        errorLog(`Cannot sync note for user '${address}'`);
        return null;
    }

    return manager.syncNote({
        address,
        noteId,
    });
};

export default {
    set: config => manager.setConfig(config),
    syncAccount,
    syncNote,
};
