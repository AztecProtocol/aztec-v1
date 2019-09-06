import NoteAccess from '~background/database/models/noteAccess';


export default async function createBulkNoteAccess(items) {
    return NoteAccess.addBulk(items);
};