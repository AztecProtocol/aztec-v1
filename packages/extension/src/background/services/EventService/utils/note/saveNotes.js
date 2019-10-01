import updateBulkNotes from './updateBulkNotes';


export default async function saveNotes({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await updateBulkNotes(createNotes, networkId);
    await updateBulkNotes(updateNotes, networkId);
    await updateBulkNotes(destroyNotes, networkId);
}
