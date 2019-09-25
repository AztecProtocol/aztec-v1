import userModel from '~database/models/user';
import noteModel from '~database/models/note';
import {
    warnLog,
    errorLog,
} from '~utils/log';
import fetchNoteFromServer from '../utils/fetchNoteFromServer';
import addNote from '../utils/addNote';
import validateNoteData from '../utils/validateNoteData';

class SyncManager {
    constructor() {
        this.config = {
            notesPerRequest: 10,
            syncInterval: 2000, // ms
            keepAll: false, // store all notes user has access to even when they are not the owner
        };
        this.accounts = new Map();
        this.paused = false;
    }

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    isValidAccount(address) {
        return this.accounts.has(address);
    }

    isInQueue(address) {
        const account = this.accounts.get(address);
        return !!(account
            && (account.syncing || account.syncReq)
        );
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

    async syncNotes(options) {
        const {
            address,
            privateKey,
            lastSynced = '',
            registeredAt = 0,
        } = options;

        const account = this.accounts.get(address);
        if (account.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(address, options);
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
        } = this.config;

        const newNotes = await fetchNoteFromServer({
            lastSynced,
            registeredAt,
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
                    ...options,
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
                ...options,
                lastSynced: nextSynced,
            });
        }, syncInterval);

        this.accounts.set(address, {
            ...account,
            syncing: false,
            syncReq,
        });
    }

    async sync({
        address,
        privateKey,
        lastSynced,
        registeredAt,
    }) {
        console.log({
            address,
            privateKey,
            lastSynced,
            registeredAt,
        });
        let account = this.accounts.get(address);
        console.log({
            account,
        });
        if (!account) {
            account = {
                syncing: false,
                syncReq: null,
                privateKey,
                registeredAt,
            };
            this.accounts.set(address, account);
        }
        console.log('here');
        return this.syncNotes({
            address,
            privateKey,
            lastSynced,
            registeredAt,
        });
    }

    async syncNote({
        address,
        noteId,
    }) {
        console.log({ noteId });
        const [rawNote] = await fetchNoteFromServer({
            account: address,
            noteId,
            numberOfNotes: 1,
        }) || [];
        console.log({ rawNote });
        if (!rawNote) {
            return null;
        }

        const {
            privateKey,
        } = this.accounts.get(address);

        if (this.config.keepAll
            || rawNote.owner.address === address
        ) {
            const newNote = await addNote(rawNote, privateKey);
            return newNote.data;
        }

        const note = await validateNoteData(rawNote, privateKey);
        return noteModel.toStorageData(note);
    }
}

export default SyncManager;
