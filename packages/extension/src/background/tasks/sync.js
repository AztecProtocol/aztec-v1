/* global chrome */
import {
    onIdle,
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
    onIdle(
        () => console.log('--- database idle ---'),
        {
            persistent: true,
        },
    );

    chrome.storage.local.clear();

    const startTimeAsync = Date.now();
    await syncNotes({
        account: '__account_id_0',
    });
    console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse', bytes);
    });
    chrome.storage.local.get(null, data => console.info(data));
}
