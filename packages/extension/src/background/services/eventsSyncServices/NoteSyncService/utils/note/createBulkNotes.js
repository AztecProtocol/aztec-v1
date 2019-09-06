import Note from '~background/database/models/note';


export default async function createBulkNotes(notes) {
    return Note.bulkAdd(notes);
}