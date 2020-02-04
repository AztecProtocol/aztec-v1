import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';

export default async function updateNote(note, networkId) {
    let updated;
    try {
        updated = await Note.update(note, { networkId });
    } catch (e) {
        warnLog('Failed to update note in indexedDB', e);
        return null;
    }

    return updated;
}
