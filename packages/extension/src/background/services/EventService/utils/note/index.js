import performCreateNote from './createNote';
import performCreateBulkNotes from './createBulkNotes';
import performUpdateNote from './updateNote';
import performUpdateBulkNotes from './updateBulkNotes';
import { NOTE_STATUS } from '~background/config/constants';


/* Create */

export const createNote = async (rawNote, networkId) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    };
    return performCreateNote(note, networkId);
};

export const createBulkNotes = async (rawNotes, networkId) => {
    const notes = rawNotes.map(rawNote => ({
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }));
    return performCreateBulkNotes(notes, networkId);
};

/* Update */

export const updateNote = async (rawNote, networkId) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    };
    return performUpdateNote(note, networkId);
};

export const updateBulkNotes = async (rawNotes, networkId) => {
    const notes = rawNotes.map(rawNote => ({
        ...rawNote,
        status: NOTE_STATUS.CREATED,
    }));
    return performUpdateBulkNotes(notes, networkId);
};

/* Destroy */

export const destroyNote = async (rawNote, networkId) => {
    const note = {
        ...rawNote,
        status: NOTE_STATUS.DESTROYED,
    };
    return performUpdateNote(note, networkId);
};

export const destroyBulkNotes = async (rawNotes, networkId) => {
    const notes = rawNotes.map(rawNote => ({
        ...rawNote,
        status: NOTE_STATUS.DESTROYED,
    }));
    return performUpdateBulkNotes(notes, networkId);
};
