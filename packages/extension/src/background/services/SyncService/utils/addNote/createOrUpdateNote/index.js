import {
    errorLog,
} from '~utils/log';
import {
    toCode,
    isDestroyed,
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
import NoteService from '~background/services/NoteService';

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
            privateKey,
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
        storage: prevStorage,
        modified,
    } = await model.set(
        newData,
        {
            ignoreDuplicate: true,
        },
    );

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

    if (isOwner) {
        const assetId = note.asset.address;
        if (isDestroyed(status)) {
            NoteService.removeNoteValue({
                assetId,
                ownerAddress,
                noteKey,
                value,
            });
        } else {
            NoteService.addNoteValue({
                assetId,
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
