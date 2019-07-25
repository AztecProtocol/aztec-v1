import findLastIndex from 'lodash/findLastIndex';
import userModel from '~database/models/user';
import fetchNoteFromServer from '../utils/fetchNoteFromServer';
import addNote from '../utils/addNote';

class SyncManager {
    constructor() {
        this.accounts = new Map();
    }

    async syncNotes({
        address,
        excludes = [],
        lastSynced = '',
        config,
    } = {}) {
        const account = this.accounts.get(address);
        this.accounts.set(address, {
            ...account,
            syncing: true,
            syncReq: null,
        });

        const {
            syncReq: prevSyncReq,
            lastSynced: savedLastSynced,
        } = account;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            notesPerRequest,
            syncInterval,
        } = config;

        const newNotes = await fetchNoteFromServer({
            lastSynced,
            excludes,
            account: address,
            numberOfNotes: notesPerRequest,
        });

        const lastNote = newNotes[newNotes.length - 1];
        const nextSynced = lastNote
            ? lastNote.timestamp
            : lastSynced;

        let nextExcludes = [];
        if (nextSynced === lastSynced) {
            nextExcludes = [
                ...excludes,
            ];
        }
        findLastIndex(newNotes, ({
            hash,
            timestamp,
        }) => {
            const isSameTime = timestamp === nextSynced;
            if (isSameTime) {
                nextExcludes.push(hash);
            }
            return !isSameTime;
        });

        if (newNotes.length) {
            await Promise.all(newNotes.map(note => addNote(note)));

            if (newNotes.length === notesPerRequest) {
                await this.syncNotes({
                    address,
                    config,
                    excludes: nextExcludes,
                    lastSynced: nextSynced,
                });

                return;
            }

            // use lastest note's timestamp as the next lastSynced
            // Don't use Date.now() since we can't be sure the timezones are the same
            if (nextSynced !== savedLastSynced) {
                await userModel.update({
                    address,
                    lastSynced: nextSynced,
                });
            }
        }

        const syncReq = setTimeout(() => {
            this.syncNotes({
                address,
                config,
                excludes: nextExcludes,
                lastSynced: nextSynced,
            });
        }, syncInterval);

        this.accounts.set(address, {
            ...account,
            lastSynced: nextSynced,
            syncing: false,
            syncReq,
        });
    }

    sync = async ({
        address,
        lastSynced,
        config,
    }) => {
        let account = this.accounts.get(address);
        if (!account) {
            account = {
                lastSynced,
                syncing: false,
                syncReq: null,
            };
            this.accounts.set(address, account);
        }
        if (!account.syncing) {
            await this.syncNotes({
                address,
                lastSynced,
                config,
            });
        }
    };
}

export default new SyncManager();
