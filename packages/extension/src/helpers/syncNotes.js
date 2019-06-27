import fetchNoteFromServer from '../utils/fetchNoteFromServer';
import asyncForEach from '../utils/asyncForEach';
import StorageService from '../services/StorageService';
import StorageServiceAsync from '../services/StorageServiceAsync';

export default async function syncNotes({
    notesPerRequest = 15,
    account = '__account_id_0',
    lastId = '',
} = {}) {
    const newNotes = await fetchNoteFromServer({
        numberOfNotes: notesPerRequest,
        account,
        lastId,
    });
    console.log('syncNotes', newNotes);

    const startTime = Date.now();
    await asyncForEach(newNotes, async (note) => {
        await StorageService.addNote(note);
    });
    console.log(`(Normal Async) Done in ${Date.now() - startTime} ms`);

    const startTimeAsync = Date.now();
    await Promise.all(newNotes.map(note => StorageServiceAsync.addNote(note)));
    console.log(`(Optimized Async) Done in ${Date.now() - startTimeAsync} ms`);
}
