import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';

export default async function createBulkNotes(notes, networkId) {
    let created;
    try {
        created = await Note.bulkAdd(notes, { networkId });
    } catch (e) {
        // TODO - some of the notes might be valid, create them individually
        warnLog('Failed to create notes in indexedDB', e);
        return null;
    }

    return created;
}
