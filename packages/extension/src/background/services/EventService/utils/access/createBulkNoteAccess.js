import NoteAccess from '~background/database/models/noteAccess';


export default async function createBulkNoteAccess(items, networkId) {
    return NoteAccess.bulkAdd(items, { networkId });
}
