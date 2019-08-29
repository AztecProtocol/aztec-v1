import noteModel from '~background/database/models/note';
import { NOTE_STATUS } from '~background/config/constants'
import {
    errorLog
} from '~utils/log'

export default async function destroyNote(noteHash) {
    if(!noteHash) {
        errorLog(`noteHash cannot be ${noteHash} in destroyNote`);
        return;
    }

    const existingRecord = await noteModel.get({
        noteHash,
    });

    if(!existingRecord) {
        errorLog(`cannot retrieve noteModel form local db by noteHash ${noteHash} in destroyNote`);
        return;
    }

    const updateFields = {
        status: NOTE_STATUS.DESTROYED
    };
    
    const id = existingRecord.id;
    await noteModel.update(id, updateFields);

    return {
        id
    }
}