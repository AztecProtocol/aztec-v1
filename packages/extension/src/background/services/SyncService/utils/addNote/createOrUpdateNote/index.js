import {
    isDestroyed,
} from '~utils/noteStatus';
import noteModel from '~database/models/note';
import noteAccessModel from '~database/models/noteAccess';
import NoteService from '~background/services/NoteService';
import validateNoteData from '../../validateNoteData';

export default async function createOrUpdateNote(note, privateKey) {
    const {
        assetKey,
        ownerKey,
        owner: {
            address: ownerAddress,
        },
        status,
    } = note;

    const isOwner = note.account.address === note.owner.address;

    const model = isOwner
        ? noteModel
        : noteAccessModel;

    const validatedNote = await validateNoteData(note, privateKey);

    const newData = {
        ...validatedNote,
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

    const justCreated = modified.length > 0;

    let data;
    if (!justCreated) {
        const {
            [noteKey]: prevNoteStorage,
        } = prevStorage;
        const newNoteStorage = model.toStorageData(newData);
        const hasChanged = prevNoteStorage.length !== newNoteStorage.length
            || prevNoteStorage.some((v, i) => v !== newNoteStorage[i]);
        if (hasChanged) {
            ({
                data,
            } = await model.update(newData));
        }
    }

    if (isOwner) {
        const assetId = note.asset.address;
        const {
            value,
        } = validatedNote;

        if (isDestroyed(status)) {
            NoteService.removeNoteValue(
                ownerAddress,
                assetId,
                value,
                noteKey,
            );
        } else {
            NoteService.addNoteValue(
                ownerAddress,
                assetId,
                value,
                noteKey,
            );
        }
    }

    return {
        key: noteKey,
        data: (data || prevData || {})[noteKey],
    };
}
