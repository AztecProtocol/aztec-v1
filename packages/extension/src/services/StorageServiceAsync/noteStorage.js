import {
    get,
    set,
} from '../../utils/storage';
import dataToKey from '../../utils/dataToKey';
import Storage from './Storage';

const createNoteIdKeyMap = async (note) => {
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
};

const addToAssetValueGroup = async (assetValueKey, noteKey) => {
    const prevAssetValueGroup = await get(assetValueKey) || [];
    if (prevAssetValueGroup.indexOf(noteKey) >= 0) return;

    await set({
        [assetValueKey]: [
            ...prevAssetValueGroup,
            noteKey,
        ],
    });
};

class NoteStorage extends Storage {
    async createOrUpdate(note) {
        const {
            id,
            assetKey,
        } = note;

        let noteKey = await get(id);
        if (!noteKey) {
            noteKey = await this.lock(
                'noteCount',
                async () => createNoteIdKeyMap(note),
            );

            // TODO - decrypt value from note hash
            const value = 100;

            const assetValueKey = dataToKey('assetValue', {
                assetKey,
                value,
            });

            await this.lock(
                assetValueKey,
                async () => addToAssetValueGroup(assetValueKey, noteKey),
            );
        }

        return {
            ...note,
            key: noteKey,
        };
    }
}

export default new NoteStorage();
