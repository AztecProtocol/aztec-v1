import createUpdateNote from './createUpdateNote';
import destroyNote from './destroyNote';


export const addNote = async (note) => {
    return await createUpdateNote(note);
};

export const updateNote = async (note) => {
    return await createUpdateNote(note);
};

export const addDestroyNote = async (note) => {
    return await destroyNote(note.noteHash);
};

