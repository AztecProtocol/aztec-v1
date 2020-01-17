import * as note from '~/background/database/models/note';


export default async function updateBulkNotes(notes, networkId) {
    return Promise.all(notes.map(note => Note.update(note, { networkId })));
}
