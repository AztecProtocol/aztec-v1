import {
    createBulkNotes,
    updateBulkNotes,
    destroyBulkNotes,
} from './note';


export default async function saveNotes({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) {
    // save it in serial
    await createBulkNotes(createNotes, networkId);
    await updateBulkNotes(updateNotes, networkId);
    await destroyBulkNotes(destroyNotes, networkId);
}
