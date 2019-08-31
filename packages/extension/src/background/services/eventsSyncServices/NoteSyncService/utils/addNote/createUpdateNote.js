import Note from '~background/database/models/note';
import { NOTE_STATUS } from '~background/config/constants'

export default async function createNote(note) {
    return Note.put({
        ...note,
        status: NOTE_STATUS.CREATED,
    });
}