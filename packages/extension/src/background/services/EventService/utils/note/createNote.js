import Note from '~background/database/models/note';


export default async function createNote(note) {
    return Note.add(note);
}