import Note from '~background/database/models/note';


export default async function updateBulkNotes(notes, networkId) {
    return Note.bulkPut(notes, { networkId });
}