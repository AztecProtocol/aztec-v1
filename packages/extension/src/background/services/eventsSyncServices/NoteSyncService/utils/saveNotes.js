import asyncForEach from '~utils/asyncForEach';
import { 
    addNote,
    updateNote,
    destroyNote,
} from './addNote';


export default async function saveNotes({ createNotes, destroyNotes, updateNotes }) {
    // save it in serial
    await asyncForEach(createNotes, async (note) => {
        await addNote(note);
    });

    await asyncForEach(updateNotes, async (note) => {
        await updateNote(note);
    });

    await asyncForEach(destroyNotes, async (note) => {
        await destroyNote(note);
    });
}