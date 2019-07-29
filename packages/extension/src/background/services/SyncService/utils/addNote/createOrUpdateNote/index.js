import {
    errorLog,
} from '~utils/log';
import dataKey from '~utils/dataKey';
import {
    toCode,
    isDestroyed,
    isEqual,
} from '~utils/noteStatus';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    fromViewingKey,
    valueOf,
} from '~utils/note';
import noteModel from '~database/models/note';
import noteAccessModel from '~database/models/noteAccess';
import assetModel from '~database/models/asset';
import NoteService from '~background/services/NoteService';
import pushAssetValue from './pushAssetValue';
import removeAssetValue from './removeAssetValue';

export default async function createOrUpdateNote(note, privateKey) {
    const {
        assetKey,
        ownerKey,
        owner: {
            address: ownerAddress,
        },
        viewingKey: encryptedVkString,
        status,
    } = note;

    const isOwner = note.account.address === note.owner.address;

    const model = isOwner
        ? noteModel
        : noteAccessModel;

    let value = 0;
    try {
        const realViewingKey = fromHexString(encryptedVkString).decrypt(privateKey);
        const aztecNote = await fromViewingKey(realViewingKey);
        value = valueOf(aztecNote);
    } catch (error) {
        errorLog('Failed to decrypt note from viewingKey.', {
            viewingKey: encryptedVkString,
        });
        value = -1;
    }

    const newData = {
        ...note,
        value,
        asset: assetKey,
        owner: ownerKey,
        status: toCode(status),
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
        : !isEqual(status, prevStatus);
    if (isOwner
        && shouldUpdateAssetBalance
    ) {
        if (value > 0) {
            promises.push(assetModel.update({
                key: assetKey,
                balance: (prevBalance) => {
                    const ratio = isNoteDestroyed ? -1 : 1;
                    return (prevBalance || 0) + (value * ratio);
                },
            }));
        }

        const assetValueKey = dataKey('assetValue', {
            assetKey,
            value,
        });
        if (isNoteDestroyed) {
            promises.push(removeAssetValue(assetValueKey, noteKey));
            NoteService.removeNoteValue({
                assetKey,
                ownerAddress,
                noteKey,
                value,
            });
        } else {
            promises.push(pushAssetValue(assetValueKey, noteKey));
            NoteService.addNoteValue({
                assetKey,
                ownerAddress,
                noteKey,
                value,
            });
        }
    }

    await Promise.all(promises);

    return {
        key: noteKey,
    };
}
