import { 
    createBulkNotes,
    updateBulkNotes,
    destroyBulkNotes,
} from './note';


export default async function saveNotes({ createNotes, updateNotes, destroyNotes }) {
    // save it in serial
    await createBulkNotes(createNotes);
    await updateBulkNotes(updateNotes);
    await destroyBulkNotes(destroyNotes);
}