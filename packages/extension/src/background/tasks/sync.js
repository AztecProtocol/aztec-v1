/* global chrome */
import {
    onIdle,
} from '~utils/storage';
import StorageService from '../services/StorageService';
import fetchNoteFromServer from '../utils/fetchNoteFromServer';

export default async function sync({
    notesPerRequest = 15,
    account = '__account_id_0',
    lastId = '',
} = {}) {
    onIdle(
        () => console.log('--- database idle ---'),
        {
            persisting: true,
        },
    );

    const newNotes = await fetchNoteFromServer({
        numberOfNotes: notesPerRequest,
        account,
        lastId,
    });
    console.log('syncNotes', newNotes);

    chrome.storage.local.clear();
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse before optimized async', bytes);
    });

    const startTimeAsync = Date.now();
    await Promise.all(newNotes.map(note => StorageService.addNote(note)));
    console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse after optimized async', bytes);
    });
    chrome.storage.local.get(null, data => console.info(data));
}
