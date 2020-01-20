import Note from '~/background/database/models/note';


export default async function createNote(note, networkId) {
    return Note.add(note, { networkId });
}
