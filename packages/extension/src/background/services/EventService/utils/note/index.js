import createNote from './createNote';
import createBulkNotes from './createBulkNotes';
import updateNote from './updateNote';
import updateBulkNotes from './updateBulkNotes';
import subscription from './subscription';
import fetchNotes from './fetchNotes';
import saveNotes from './saveNotes';

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
    subscription,
    fetchNotes,
    saveNotes,
};
