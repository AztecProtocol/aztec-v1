import {
    get,
    set,
} from '../../utils/storage';
import dataToKey from '../../utils/dataToKey';
import Storage from './Storage';

class NoteStorage extends Storage {
    async createOrUpdate(note) {
        if (this.locked) {
            return this.waitInQueue({
                method: 'createOrUpdate',
                args: [note],
            });
        }

        const {
            id,
            assetKey,
        } = note;
        let noteKey = await get(id);
        if (!noteKey) {
            const noteCount = await get('noteCount') || 0;

            noteKey = dataToKey('note', {
                count: noteCount,
            });

            // TODO - decrypt value from note hash
            const value = 100;

            const assetValueKey = dataToKey('assetValue', {
                assetKey,
                value,
            });
            const prevAssetValueGroup = await get(assetValueKey) || [];

            await set({
                [id]: noteKey,
                [assetValueKey]: [
                    ...prevAssetValueGroup,
                    noteKey,
                ],
                noteCount: noteCount + 1,
            });
        }


        this.locked = false;
        this.nextInQueue();

        return {
            ...note,
            key: noteKey,
        };
    }
}

export default new NoteStorage();
