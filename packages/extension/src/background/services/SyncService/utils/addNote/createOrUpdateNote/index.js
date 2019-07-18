import dataKey from '~utils/dataKey';
import {
    isDestroyed,
} from '~utils/noteStatus';
import noteModel from '~database/models/note';
import noteAccessModel from '~database/models/noteAccess';
import assetModel from '~database/models/asset';
import pushAssetValue from './pushAssetValue';
import removeAssetValue from './removeAssetValue';

export default async function createOrUpdateNote(note) {
    const {
        assetKey,
        ownerKey,
        status,
    } = note;

    const isOwner = note.account.address === note.owner.address;

    const model = isOwner
        ? noteModel
        : noteAccessModel;

    // TODO - decrypt value from note hash
    const value = 100;

    const newData = {
        ...note,
        value,
        asset: assetKey,
        owner: ownerKey,
    };

    const {
        key: noteKey,
        data: prevData,
        storage: prevStorage,
        modified,
    } = await model.set(
        newData,
        {
            ignoreDuplicate: true,
        },
    );

    const {
        [noteKey]: prevNoteData,
    } = prevData;
    const justCreated = modified.length > 0;

    const promises = [];

    if (!justCreated) {
        const {
            [noteKey]: prevNoteStorage,
        } = prevStorage;
        const newNoteStorage = model.toStorageData(newData);
        const hasChanged = prevNoteStorage.length !== newNoteStorage.length
            || prevNoteStorage.some((v, i) => v !== newNoteStorage[i]);
        if (hasChanged) {
            promises.push(model.update(newData));
        }
    }

    const {
        status: prevStatus,
    } = prevNoteData;
    const isNoteDestroyed = isDestroyed(status);
    const shouldUpdateAssetBalance = justCreated
        ? !isNoteDestroyed
        : status !== prevStatus;
    if (isOwner
        && shouldUpdateAssetBalance
    ) {
        promises.push(assetModel.update({
            key: assetKey,
            balance: (prevBalance) => {
                const ratio = isNoteDestroyed ? -1 : 1;
                return (prevBalance || 0) + (value * ratio);
            },
        }));

        const assetValueKey = dataKey('assetValue', {
            assetKey,
            value,
        });

        if (isNoteDestroyed) {
            promises.push(removeAssetValue(assetValueKey, noteKey));
        } else {
            promises.push(pushAssetValue(assetValueKey, noteKey));
        }
    }

    await Promise.all(promises);

    return {
        key: noteKey,
    };
}
