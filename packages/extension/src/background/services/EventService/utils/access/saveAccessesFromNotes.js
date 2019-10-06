import updateBulkNoteAccessFromNotes from './updateBulkNoteAccessFromNotes';


export default async function saveAccessesFromNotes({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await updateBulkNoteAccessFromNotes([
        ...createNotes,
        ...updateNotes,
        ...destroyNotes,
    ], networkId);
}
