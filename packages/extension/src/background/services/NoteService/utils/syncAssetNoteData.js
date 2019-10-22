import {
    errorLog,
} from '~utils/log';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    valueFromViewingKey,
} from '~utils/note';
import Note from '~background/database/models/note';
import {
    NOTE_STATUS,
} from '~config/constants';
import metadata from '~utils/metadata';


export default async function syncAssetNoteData(
    ownerAddress,
    linkedPrivateKey,
    assetId,
    lastSynced = null,
    networkId,
) {
    const noteValues = {};
    let balance = 0;
    let currentSynced = '';
    const {
        blockNumber: lastSyncedBlock = 0,
    } = Note.get({ networkId }, lastSynced);

    await Note.query({ networkId })
        .where({
            owner: ownerAddress,
            asset: assetId,
            status: NOTE_STATUS.CREATED,
        })
        .and(n => n.blockNumber >= lastSyncedBlock)
        .each(({ noteHash, metadata: metadataStr }) => {
            const {
                viewingKey: encryptedVkString,
            } = metadata(metadataStr).getAccess(ownerAddress);

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
    
    console.log(`balance after decryption: ${balance}, networkId: ${networkId}`);

    return {
        balance,
        noteValues,
        lastSynced: currentSynced,
    };
}
