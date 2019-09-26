import NoteAccess from '~background/database/models/noteAccess';


export default async function updateBulkNoteAccess(items, networkId) {
    return NoteAccess.bulkPut(items, { networkId });
}
