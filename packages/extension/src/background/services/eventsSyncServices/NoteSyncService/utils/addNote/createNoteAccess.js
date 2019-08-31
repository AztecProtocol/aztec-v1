import NoteAccess from '~background/database/models/noteAccess';


export default async function createNoteAccess(fields) {
    return NoteAccess.put(fields);
};