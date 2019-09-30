import {
    createBulkNoteAccessFromNotes,
    updateBulkNoteAccessFromNotes,
} from './access';


export default async function saveNotesAccess({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await createBulkNoteAccessFromNotes(createNotes, networkId);
    await updateBulkNoteAccessFromNotes(updateNotes, networkId);
    await updateBulkNoteAccessFromNotes(destroyNotes, networkId);
}
