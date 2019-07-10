import {
    errorLog,
} from '~utils/log';
import userModel from '~database/models/user';
import fetchNoteFromServer from './utils/fetchNoteFromServer';
import addNote from './utils/addNote';

class SyncService {
    constructor() {
        this.accounts = new Map();
        this.config = {
            graphNodeServerUrl: '',
            notesPerRequest: 10,
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

    async syncNotes({
        address,
        lastId = '',
    } = {}) {
        const account = this.accounts.get(address);
        if (!account) return;

        const {
            graphNodeServerUrl,
            notesPerRequest,
        } = this.config;
        this.accounts.set(address, {
            ...account,
            syncing: true,
        });

        const newNotes = await fetchNoteFromServer({
            account: address,
            lastId,
            graphNodeServerUrl,
            numberOfNotes: notesPerRequest,
        });
        console.log('syncNotes', newNotes);

        await Promise.all(newNotes.map(note => addNote(note)));

        const lastNote = newNotes[newNotes.length - 1];
        if (newNotes.length === notesPerRequest) {
            await this.syncNotes({
                address,
                lastId: lastNote.logId,
            });
        }

        this.accounts.set(address, {
            ...account,
            syncing: false,
        });
        await userModel.update({
            address,
            lastSyncedLogId: lastNote.logId,
        });
    }

    async syncAccount(address) {
        if (!address) {
            errorLog("'address' can not be empty in SyncService.syncAccount(address)");
            return;
        }

        const user = await userModel.get({
            address,
        });
        if (!user) {
            errorLog(`Account '${address}' has no permission to sync notes from ${this.graphNodeServerUrl}`);
            return;
        }

        let account = this.accounts.get(address);
        if (!account) {
            account = {
                syncing: false,
            };
            this.accounts.set(address, account);
        }

        if (!account.syncing) {
            await this.syncNotes({
                address,
                lastId: user.lastSyncedLogId,
            });
        }
    }
}

export default new SyncService();
