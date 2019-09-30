import updateBulkNoteAccess from './updateBulkNoteAccess';
import Note from '~background/database/models/note';
import getNoteAccessId from '~background/database/models/noteAccess/getNoteAccessId';
import metadata from '~utils/metadata';
import asyncFlatMap from '~utils/asyncFlatMap';

import {
    errorLog,
} from '~utils/log';

const accessesFromMetadata = (note, prevNote) => {
    const {
        metadata: metadataStr,
        noteHash,
        asset,
        blockNumber,
    } = note;

    const {
        metadata: prevMetadataStr,
    } = prevNote || {};

    if (!metadataStr) {
        errorLog('metadata cannot be undefined in "acessesFromMetadata"');
        return null;
    }

    const metadataObj = metadata(metadataStr);
    const prevMetadataObj = prevMetadataStr ? metadata(prevMetadataStr) : null;
    const noteAccesses = [];

    const {
        addresses,
        viewingKeys,
    } = metadataObj;

    for (let i = 0; i < addresses.length; i += 1) {
        const account = addresses[i];
        const viewingKey = viewingKeys[i];
        const id = getNoteAccessId(account, asset);

        let prevViewingKey;
        if (prevMetadataObj) {
            ({
                viewingKey: prevViewingKey,
            } = prevMetadataObj.getAccess(addresses[i]) || {});
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
    const accesses = rawNotes.flatMap(note => accessesFromMetadata(note));

    return updateBulkNoteAccess(accesses, networkId);
};

/* Update */

export const updateBulkNoteAccessFromNotes = async (rawNotes, networkId) => {
    const accesses = await asyncFlatMap(rawNotes, async (note) => {
        const prevNote = await Note.get({ networkId }, note.noteHash);
        return acessesFromMetadata(note, prevNote);
    });

    return updateBulkNoteAccess(accesses, networkId);
};
