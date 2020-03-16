import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';

export default async function updateBulkNotes(notes, networkId) {
    const updatedNotes = [];

    await Promise.all(
        notes.map(async (note) => {
            let updated;
            try {
                updated = await Note.update(note, { networkId });
                updatedNotes.push(note);
            } catch (e) {
                warnLog('Failed to update note in indexedDB', e);
            }
            return updated;
        }),
    );

    return updatedNotes;
}
