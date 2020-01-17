import * as note from './Note';

export default async function noteFactory(noteId) {
    const note = new Note({
        id: noteId,
    });
    await note.init();

    return note;
}
