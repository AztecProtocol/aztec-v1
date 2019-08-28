import noteModel from '~background/database/models/note';
import { NOTE_STATUS } from '~background/config/constants'

export default async function createNote(note, status) {
    const existingRecord = await noteModel.get({
        noteHash,
    });

    let id;
    if(existingRecord) {
        id = existingRecord.id;
        const updateFields = {
            status: NOTE_STATUS.CREATED,
        };
        await noteModel.update(existingRecord.id, updateFields);
    } else {
        const fields = {
            ...note,
            status: NOTE_STATUS.CREATED,
        };
        id = await noteModel.add(fields);
    }

    return {
        id
    }
}