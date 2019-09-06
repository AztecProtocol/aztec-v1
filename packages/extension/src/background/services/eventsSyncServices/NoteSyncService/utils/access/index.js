import performCreateBulkNoteAccess from './createBulkNoteAccess';
import Note from '~background/database/models/note';
import metadata from '~utils/metadata';
import asyncFlatMap from '~utils/asyncFlatMap'

import {
    errorLog
} from '~utils/log'

const acessesFromMetadata = ({
    metadata: metadataStr, 
    noteHash,
    blockNumber,
}, prevNote) => {

    if (!metadataStr) {
        errorLog('metadata cannot be undefined in "acessesFromMetadata"')
        return;
    }

    const metadataObj = metadata(metadataStr);
    const prevMetadataObj = prevNote ? metadata(prevNote.metadata) : null;
    const noteAccesses = [];
    
    for (let i = 0; i < metadataObj.addresses.length; i += 1) {
        const {address, viewingKey} = metadataObj.getAccess(metadataObj.addresses[i]);

        let prevViewingKey;

        if(prevMetadataObj) {
            ({viewingKey: prevViewingKey} = prevMetadataObj.getAccess(metadataObj.addresses[i]) || {});
        }
     
        if (viewingKey !== prevViewingKey) {          
            noteAccesses.push({
                    noteHash,
                    account: address,
                    viewingKey,
                    blockNumber,
                });
        }
    }
    return noteAccesses;
}


/* Create */

export const createBulkNoteAccessFromNotes = async (rawNotes) => {

    const accesses = rawNotes.flatMap(note => acessesFromMetadata(note));
    return performCreateBulkNoteAccess(accesses);
};

/* Update */

export const updateBulkNoteAccessFromNotes = async (rawNotes) => {

    const accesses = await asyncFlatMap(rawNotes, async (note) => {
        const prevNote = await Note.get(note.noteHash);
        return acessesFromMetadata(note, prevNote);
    });
    
    return performCreateBulkNoteAccess(accesses);
};