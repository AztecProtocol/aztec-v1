import updateBulkNoteAccess from './updateBulkNoteAccess';
import Note from '~background/database/models/note';
import asyncFlatMap from '~utils/asyncFlatMap';
import accessesFromMetadata from './accessesFromMetadata';


export default async function updateBulkNoteAccessFromNotes(rawNotes, networkId) {
    const accesses = await asyncFlatMap(rawNotes, async (note) => {
        const prevNote = await Note.get({ networkId }, note.noteHash);
        return accessesFromMetadata(note, prevNote);
    });

    return updateBulkNoteAccess(accesses, networkId);
}
