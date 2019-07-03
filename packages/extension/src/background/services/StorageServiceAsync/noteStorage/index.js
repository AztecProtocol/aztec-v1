import {
    lock,
} from '~utils/storage';
import dataKey from '~utils/dataKey';
import noteModel from '~database/models/note';
import assetModel from '~database/models/asset';
import pushAssetValue from './pushAssetValue';

const createOrUpdate = async (note) => {
    const {
        id,
        assetKey,
        ...noteData
    } = note;

    // TODO - decrypt value from note hash
    const value = 100;

    const {
        data,
        modified,
    } = await noteModel.set(
        {
            id,
            value,
            asset: assetKey,
            ...noteData,
        },
        {
            ignoreDuplicate: true,
        },
    );

    let noteKey;

    if (modified.indexOf(id) < 0) {
        // TODO
        // didn't create a new note
        // update existing data instead
    } else {
        ({
            [id]: noteKey,
        } = data);

        await assetModel.update({
            key: assetKey,
            balance: prevValue => (prevValue || 0) + value,
        });

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
