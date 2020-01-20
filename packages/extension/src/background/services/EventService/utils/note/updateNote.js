import Note from '~/background/database/models/note';


export default async function updateNote(note, networkId) {
    return Note.update(note, { networkId });
}
