import performCreateBulkNoteAccess from './createBulkNoteAccess';
import updateBulkNoteAccess from './updateBulkNoteAccess';
import Note from '~background/database/models/note';
import metadata from '~utils/metadata';
import asyncFlatMap from '~utils/asyncFlatMap';

import {
    errorLog,
} from '~utils/log';

const acessesFromMetadata = ({
    metadata: metadataStr,
    noteHash,
    asset,
    blockNumber,
}, prevNote) => {
    if (!metadataStr) {
        errorLog('metadata cannot be undefined in "acessesFromMetadata"')
        return null;
    }

    const metadataObj = metadata(metadataStr);
    const prevMetadataObj = prevNote ? metadata(prevNote.metadata) : null;
    const noteAccesses = [];

    for (let i = 0; i < metadataObj.addresses.length; i += 1) {
        const {
            address: account,
            viewingKey,
        } = metadataObj.getAccess(metadataObj.addresses[i]);
        const id = `${account}_${asset}`;

        let prevViewingKey;
        if (prevMetadataObj) {
            ({
                viewingKey: prevViewingKey,
            } = prevMetadataObj.getAccess(metadataObj.addresses[i]) || {});
        }

        if (viewingKey !== prevViewingKey) {
            noteAccesses.push({
                id,
                noteHash,
                account,
                viewingKey,
                blockNumber,
            });
        }
    }
    return noteAccesses;
};


/* Create */

export const createBulkNoteAccessFromNotes = async (rawNotes, networkId) => {
    const accesses = rawNotes.flatMap(acessesFromMetadata);

    console.log(`createBulkNoteAccessFromNotes: ${JSON.stringify(accesses)}`);

    return performCreateBulkNoteAccess(accesses, networkId);
};

/* Update */

export const updateBulkNoteAccessFromNotes = async (rawNotes, networkId) => {
    const accesses = await asyncFlatMap(rawNotes, async (note) => {
        const prevNote = await Note.get({ networkId }, note.noteHash);
        return acessesFromMetadata(note, prevNote);
    });

    return updateBulkNoteAccess(accesses, networkId);
};
