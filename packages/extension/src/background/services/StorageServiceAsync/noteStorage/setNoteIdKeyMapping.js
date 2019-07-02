import {
    get,
    set,
} from '~utils/storage';
import dataKey from '~utils/dataKey';

export default async function setNoteIdKeyMapping(note) {
    const {
        id,
    } = note;

    let noteKey = await get(id);
    if (noteKey) {
        return noteKey;
    }

    const noteCount = await get('noteCount') || 0;
    noteKey = dataKey('note', {
        count: noteCount,
    });

    await set({
        [id]: noteKey,
        noteCount: noteCount + 1,
    });

    return noteKey;
}
