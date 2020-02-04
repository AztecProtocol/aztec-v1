import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';

export default async function createNote(note, networkId) {
    let newNote;
    try {
        newNote = await Note.add(note, { networkId });
    } catch (e) {
        warnLog('Failed to create a note in indexedDB', e);
        return null;
    }

    return newNote;
}
