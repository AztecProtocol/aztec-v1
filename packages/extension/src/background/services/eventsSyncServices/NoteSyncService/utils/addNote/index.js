import createUpdateNote from './createUpdateNote';
import destroyNote from './destroyNote';


export const addNote = async (note) => {
    return createUpdateNote(note);
};

export const updateNote = async (note) => {
    return createUpdateNote(note);
};

export const addDestroyNote = async (note) => {
    return destroyNote(note.noteHash);
};

