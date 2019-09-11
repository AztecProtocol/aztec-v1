import { 
    createBulkNotes,
    updateBulkNotes,
    destroyBulkNotes,
} from './note';


export const saveNotes = async ({ createNotes, updateNotes, destroyNotes }) => {
    // save it in serial
    await createBulkNotes(createNotes);
    await updateBulkNotes(updateNotes);
    await destroyBulkNotes(destroyNotes);
}