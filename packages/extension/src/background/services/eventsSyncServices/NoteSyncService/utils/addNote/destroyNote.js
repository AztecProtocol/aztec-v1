import Note from '~background/database/models/note';
import { NOTE_STATUS } from '~background/config/constants'

export default async function destroyNote(note) {
    return Note.put({
        ...note,
        status: NOTE_STATUS.DESTROYED,
    });
}