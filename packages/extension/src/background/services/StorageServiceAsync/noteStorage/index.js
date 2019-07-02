import {
    get,
    lock,
} from '~utils/storage';
import dataKey from '~utils/dataKey';
import setNoteIdKeyMapping from './setNoteIdKeyMapping';
import pushAssetValue from './pushAssetValue';

const createOrUpdate = async (note) => {
    const {
        id,
        assetKey,
    } = note;

    let noteKey = await get(id);
    if (!noteKey) {
        noteKey = await lock(
            'noteCount',
            async () => setNoteIdKeyMapping(note),
        );

        // TODO - decrypt value from note hash
        const value = 100;

        const assetValueKey = dataKey('assetValue', {
            assetKey,
            value,
        });

        await lock(
            assetValueKey,
            async () => pushAssetValue(assetValueKey, noteKey),
        );
    }

    return {
        ...note,
        key: noteKey,
    };
};

export default {
    createOrUpdate,
};
