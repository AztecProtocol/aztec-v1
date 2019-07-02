/* global chrome */
import {
    onIdle,
} from '~utils/storage';
import asyncForEach from '~utils/asyncForEach';
import StorageService from '../../services/StorageService';
import StorageServiceAsync from '../../services/StorageServiceAsync';
import fetchNoteFromServer from './fetchNoteFromServer';

export default async function syncNotes({
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
        console.log('getBytesInUse before normal async', bytes);
    });

    const startTime = Date.now();
    await asyncForEach(newNotes, async (note) => {
        await StorageService.addNote(note);
    });
    console.log(`(Normal Async) Done in ${Date.now() - startTime} ms`);

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse after normal async', bytes);
    });
    chrome.storage.local.get(null, data => console.info(data));

    chrome.storage.local.clear();
    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse before optimized async', bytes);
    });

    const startTimeAsync = Date.now();
    await Promise.all(newNotes.map(note => StorageServiceAsync.addNote(note)));
    console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);

    chrome.storage.local.getBytesInUse(null, (bytes) => {
        console.log('getBytesInUse after optimized async', bytes);
    });
    chrome.storage.local.get(null, data => console.info(data));
}
