import createBulkNoteAccessFromNotes from './createBulkNoteAccessFromNotes';
import updateBulkNoteAccessFromNotes from './updateBulkNoteAccessFromNotes';


export default async function saveAccessesFromNotes({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await createBulkNoteAccessFromNotes(createNotes, networkId);
    await updateBulkNoteAccessFromNotes(updateNotes, networkId);
    await updateBulkNoteAccessFromNotes(destroyNotes, networkId);
}
