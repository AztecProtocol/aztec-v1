import updateBulkNoteAccess from './updateBulkNoteAccess';
import accessesFromMetadata from './accessesFromMetadata';


export default async function updateBulkNoteAccessFromNotes(rawNotes, networkId) {
    const accesses = rawNotes.flatMap(note => accessesFromMetadata(note));
    return updateBulkNoteAccess(accesses, networkId);
}
