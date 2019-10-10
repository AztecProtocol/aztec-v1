// import assetModel from '~database/models/asset';
// import addressModel from '~database/models/address';
import {
    errorLog,
} from '~utils/log';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    valueFromViewingKey,
} from '~utils/note';
// import {
//     isDestroyed,
// } from '~utils/noteStatus';
import Note from '~background/database/models/note';
import NoteAccess from '~background/database/models/noteAccess';
import getNoteAccessId from '~background/database/models/noteAccess/getNoteAccessId';
import {
    NOTE_STATUS,
} from '~config/constants';
import asyncForEach from '~utils/asyncForEach';

export default async function syncAssetNoteData(
    ownerAddress,
    linkedPrivateKey,
    assetId,
    lastSynced = null,
    // TODO: pass networkId 0
    networkId = 0,
) {
    const noteValues = {};
    let balance = 0;
    let currentSynced = '';

    const {
        blockNumber: lastSyncedBlock = 0,
    } = Note.get({ networkId }, lastSynced);

    const ownerAssetStatus = `${ownerAddress}_${assetId}_${NOTE_STATUS.CREATED}`;
    const noteHashes = await Note.query({ networkId })
        .where({ ownerAssetStatus })
        .and(n => n.blockNumber >= lastSyncedBlock && n.noteHash !== lastSynced)
        .primaryKeys();

    await asyncForEach(noteHashes, async (noteHash) => {
        const accessId = getNoteAccessId(ownerAddress, noteHash);
        const {
            viewingKey: encryptedVkString,
        } = await NoteAccess.get({ networkId }, accessId);

        let value = 0;
        try {
            const realViewingKey = fromHexString(encryptedVkString).decrypt(linkedPrivateKey);
            value = valueFromViewingKey(realViewingKey);
        } catch (error) {
            errorLog('Failed to decrypt note from viewingKey.', {
                viewingKey: encryptedVkString,
                error,
            });
            throw error;
        }

        if (!noteValues[value]) {
            noteValues[value] = [];
        }
        noteValues[value].push(noteHash);
        balance += value;
        currentSynced = noteHash;
    });

    return {
        balance,
        noteValues,
        lastSynced: currentSynced,
    };
}
