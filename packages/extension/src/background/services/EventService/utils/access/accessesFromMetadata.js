import getNoteAccessId from '~background/database/models/noteAccess/getNoteAccessId';
import metadata from '~utils/metadata';
import {
    errorLog,
} from '~utils/log';

export default function accessesFromMetadata(note, prevNote) {
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
        errorLog('metadata cannot be undefined in "accessesFromMetadata"');
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
}
