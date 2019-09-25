import createNote from './createNote';
import createBulkNotes from './createBulkNotes';
import updateNote from './updateNote';
import updateBulkNotes from './updateBulkNotes';

/* Destroy */

const destroyNote = updateNote;
const destroyBulkNotes = updateBulkNotes;


export {
    createNote,
    createBulkNotes,
    updateNote,
    updateBulkNotes,
    destroyNote,
    destroyBulkNotes,
};
