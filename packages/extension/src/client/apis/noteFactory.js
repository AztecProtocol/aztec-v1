import Note from './note';

export default async function noteFactory(noteId) {
    const note = new Note({
        id: noteId,
    });
    await note.refresh();

    return note;
}
