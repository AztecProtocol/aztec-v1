import {
    createBulkNotes,
    updateBulkNotes,
    destroyBulkNotes,
} from './note';


export const saveNotes = async ({
    createNotes,
    updateNotes,
    destroyNotes,
}, networkId) => {
    // save it in serial
    await createBulkNotes(createNotes, networkId);
    await updateBulkNotes(updateNotes, networkId);
    await destroyBulkNotes(destroyNotes, networkId);
}