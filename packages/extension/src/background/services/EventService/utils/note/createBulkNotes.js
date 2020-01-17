import * as note from '~/background/database/models/note';


export default async function createBulkNotes(notes, networkId) {
    return Note.bulkAdd(notes, { networkId });
}
