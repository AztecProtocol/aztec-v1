import userModel from '~database/models/user';
import {
    warnLog,
    errorLog,
} from '~utils/log';
import fetchNoteFromServer from '../utils/fetchNoteFromServer';
import addNote from '../utils/addNote';

class SyncManager {
    constructor() {
        this.accounts = new Map();
        this.paused = false;
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync notes from graph node.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (address, prevState = {}) => {
        const account = this.accounts.get(address);
        if (!account) {
            warnLog(`Account ${address} is not in sync process.`);
            return;
        }

        this.accounts.set(address, {
            ...account,
            pausedState: prevState,
        });
    };

    resume = (address) => {
        const account = this.accounts.get(address);
        if (!account) {
            warnLog(`Account ${address} is not in sync process.`);
            return;
        }

        const {
            pausedState,
        } = account;
        if (!pausedState) {
            warnLog(`Account ${address} is already running.`);
            return;
        }

        this.accounts.set(address, {
            ...account,
            pausedState: null,
        });

        this.syncNotes({
            ...pausedState,
            address,
        });
    };

    async syncNotes({
        address,
        privateKey,
        lastSynced = '',
        config,
    } = {}) {
        const account = this.accounts.get(address);
        if (account.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(address, {
                privateKey,
                lastSynced,
                config,
            });
            return;
        }

        this.accounts.set(address, {
            ...account,
            syncing: true,
            syncReq: null,
        });

        const {
            syncReq: prevSyncReq,
        } = account;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            notesPerRequest,
            syncInterval,
            keepAll,
        } = config;

        const newNotes = await fetchNoteFromServer({
            lastSynced,
            account: address,
            numberOfNotes: notesPerRequest,
            onError: this.handleFetchError,
        });

        const lastNote = newNotes[newNotes.length - 1];
        const nextSynced = lastNote
            ? lastNote.logId
            : lastSynced;

        if (newNotes.length) {
            const notesToStore = keepAll
                ? newNotes
                : newNotes.filter(({ owner }) => owner.address === address);
            await Promise.all(notesToStore.map(note => addNote(note, privateKey)));

            if (newNotes.length === notesPerRequest) {
                await this.syncNotes({
                    address,
                    privateKey,
                    config,
                    lastSynced: nextSynced,
                });

                return;
            }

            await userModel.update({
                address,
                lastSynced: nextSynced,
            });
        }

        const syncReq = setTimeout(() => {
            this.syncNotes({
                address,
                privateKey,
                config,
                lastSynced: nextSynced,
            });
        }, syncInterval);

        this.accounts.set(address, {
            ...account,
            syncing: false,
            syncReq,
        });
    }

    sync = async ({
        address,
        privateKey,
        lastSynced,
        config,
    }) => {
        let account = this.accounts.get(address);
        if (!account) {
            account = {
                syncing: false,
                syncReq: null,
            };
            this.accounts.set(address, account);
        }
        if (!account.syncing) {
            await this.syncNotes({
                address,
                privateKey,
                lastSynced,
                config,
            });
        }
    };
}

export default new SyncManager();
