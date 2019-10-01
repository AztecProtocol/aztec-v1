import accessesFromMetadata from './accessesFromMetadata';
import updateBulkNoteAccess from './updateBulkNoteAccess';


export default async function createBulkNoteAccessFromNotes(rawNotes, networkId) {
    const accesses = rawNotes.flatMap(note => accessesFromMetadata(note));

    return updateBulkNoteAccess(accesses, networkId);
}
