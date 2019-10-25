import updateBulkNotes from './updateBulkNotes';
import createBulkNotes from './createBulkNotes';


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
