import createBulkNotes from './createBulkNotes';
import updateBulkNotes from './updateBulkNotes';


export default async function saveNotes({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await createBulkNotes(createNotes, networkId);
    await updateBulkNotes(updateNotes, networkId);
    await updateBulkNotes(destroyNotes, networkId);
}
