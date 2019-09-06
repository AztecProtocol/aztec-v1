import Note from '~background/database/models/note';


export default async function updateNote(note) {
    return Note.put(note);
}