import Note from '~background/database/models/note';


export default async function updateBulkNotes(notes) {
    return Note.bulkPut(notes);
}