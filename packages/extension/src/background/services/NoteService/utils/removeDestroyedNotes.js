import noteModel from '~database/models/note';
import {
    isDestroyed,
} from '~utils/noteStatus';
import getBalanceFromNoteValues from './getBalanceFromNoteValues';

export default async function removeDestroyedNotes(assetNoteData) {
    const {
        noteValues: prevNoteValues,
    } = assetNoteData;

    const noteValues = {};
    const validateNoteStatus = async (value, noteKey) => {
        const note = await noteModel.get({
            key: noteKey,
        });
        if (note && !isDestroyed(note.status)) {
            noteValues[value].push(noteKey);
        }
    };

    const promises = [];
    Object.keys(prevNoteValues).map(async (value) => {
        noteValues[value] = [];
        prevNoteValues[value].forEach((noteKey) => {
            promises.push(validateNoteStatus(value, noteKey));
        });
    });

    await Promise.all(promises);

    const balance = getBalanceFromNoteValues(noteValues);

    return {
        ...assetNoteData,
        balance,
        noteValues,
    };
}
