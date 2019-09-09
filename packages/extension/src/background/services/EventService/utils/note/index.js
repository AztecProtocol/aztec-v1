import performCreateNote from './createNote';
import performCreateBulkNotes from './createBulkNotes';
import performUpdateNote from './updateNote';
import performUpdateBulkNotes from './updateBulkNotes';
import { NOTE_STATUS } from '~background/config/constants';


/* Create */

export const createNote = async (rawNote) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }
    return performCreateNote(note);
};

export const createBulkNotes = async (rawNotes) => {
    const notes = rawNotes.map(rawNote => ({
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }));
    return performCreateBulkNotes(notes);
};

/* Update */

export const updateNote = async (rawNote) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }
    return performUpdateNote(note);
};

export const updateBulkNotes = async (rawNotes) => {
    const notes = rawNotes.map(rawNote => ({
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }));
    return performUpdateBulkNotes(notes);
};

/* Destroy */

export const destroyNote = async (rawNote) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.DESTROYED,
    };
    return performUpdateNote(note);
};

export const destroyBulkNotes = async (rawNotes) => {
    const notes = rawNotes.map((rawNote) => ({
        ...rawNote,
        status: NOTE_STATUS.DESTROYED,
    }));
    return performUpdateBulkNotes(notes);
};


