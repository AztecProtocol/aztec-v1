/* global chrome */
import {
    set,
} from '~utils/storage';
import StorageService from '../services/StorageService';
import fetchNoteFromServer from '../utils/fetchNoteFromServer';

const syncNotes = async ({
    account,
    lastId = '',
    notesPerRequest = 10,
} = {}) => {
    const newNotes = await fetchNoteFromServer({
        numberOfNotes: notesPerRequest,
        account,
        lastId,
    });
    console.log('syncNotes', newNotes);

    await Promise.all(newNotes.map(note => StorageService.addNote(note)));
    if (newNotes.length === notesPerRequest) {
        const lastNote = newNotes[newNotes.length - 1];
        await syncNotes({
            account,
            notesPerRequest,
            lastId: lastNote.logId,
        });
    }
};

export default async function sync() {
    // TODO
    // implement onStart in LockManager and set _sync: 1 through it
    await set({
        _sync: 1,
    });

    const startTimeAsync = Date.now();
    await syncNotes({
        account: '__account_id_0',
    });
    console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse', bytes);
    });
}
