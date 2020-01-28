import ZkNote from './ZkNote';

export default async function noteFactory(noteId) {
    const note = new ZkNote({
        id: noteId,
    });
    await note.init();

    return note;
}
