import createUpdateNote from './createUpdateNote';
import destroyNotePerform from './destroyNote';
import createNoteAccess from './createNoteAccess';
import parseAddressesFromMetadata from './utils/parseAddressesFromMetadata'
import parseNoteAccessFromMetadata from './utils/parseNoteAccessFromMetadata'
import {
    errorLog
} from '~utils/log'

const createAccessFromMetadata = async (timestamp = 0, {metadata, noteHash}, prevMetadata) => {
    if (!metadata) {
        errorLog('metadata cannot be undefined in "createAccessFromMetadata"')
        return;
    }
    
    const addresses = parseAddressesFromMetadata(metadata);
    const accessMap = parseNoteAccessFromMetadata(metadata);
    const prevAccessMap = parseNoteAccessFromMetadata(prevMetadata);
    
    let address;
    let viewingKey;
    let prevViewingKey;
    for (let i = 0; i < addresses.length; i += 1) {
        address = addresses[i];
        // let addressKey = address.toHexString();
        viewingKey = accessMap.get(address);
        prevViewingKey = prevAccessMap.has(address) ? prevAccessMap.get(address) : null;
        
        if (viewingKey !== prevViewingKey) {
            let pk = await createNoteAccess({
                noteHash,
                account: address,
                viewingKey,
                timestamp,
            });
            // createNoteLog(timestamp, pk, address, note.status);
        }
    }
}


export const addNote = async (note) => {
    const res = await createUpdateNote(note);
    await createAccessFromMetadata(0, note);
    return res;
};

export const updateNote = async (note) => {
    return await createUpdateNote(note);
};

export const destroyNote = async (note) => {
    return await destroyNotePerform(note);
};


