import {
    errorLog,
} from '~utils/log';
import userModel from '~database/models/user';
import SyncManager from './helpers/SyncManager';

class SyncService {
    constructor() {
        this.config = {
            notesPerRequest: 10,
            syncInterval: 2000, // ms
            keepAll: false, // store all notes user has access to even when they are not the owner
        };
    }

    set(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    async syncAccount({
        address,
        privateKey,
    }) {
        if (!address) {
            errorLog("'address' can not be empty in SyncService.syncAccount()");
            return;
        }
        if (!privateKey) {
            errorLog("'privateKey' can not be empty in SyncService.syncAccount()");
            return;
        }

        const user = await userModel.get({
            address,
        });
        if (!user) {
            errorLog(`Account '${address}' has no permission to sync notes from graph node server`);
            return;
        }

        const {
            lastSynced,
        } = user;

        SyncManager.sync({
            config: this.config,
            address,
            privateKey,
            lastSynced: (lastSynced | 0) + 1, // eslint-disable-line no-bitwise
        });
    }
}

export default new SyncService();
