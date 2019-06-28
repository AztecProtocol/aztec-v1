import {
    get,
    set,
} from '~utils/storage';
import dataToKey from '~utils/dataToKey';

export default async function createNoteIdKeyMap(note) {
    const {
        id,
    } = note;

    let noteKey = await get(id);
    if (noteKey) {
        return noteKey;
    }

    const noteCount = await get('noteCount') || 0;
    noteKey = dataToKey('note', {
        count: noteCount,
    });

    await set({
        [id]: noteKey,
        noteCount: noteCount + 1,
    });

    return noteKey;
}
