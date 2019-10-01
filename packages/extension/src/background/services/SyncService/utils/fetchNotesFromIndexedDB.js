import Asset from '~background/database/models/asset';
import Note from '~background/database/models/note';
import NoteAccess from '~background/database/models/noteAccess';
import getNoteAccessId from '~background/database/models/noteAccess/getNoteAccessId';
import {
    errorLog,
} from '~utils/log';


const packNote = (note, noteAccess, asset) => ({
    logId: note.noteHash,
    blockNumber: note.blockNumber,
    status: note.status,
    account: {
        address: note.owner,
    },
    noteAccess: {
        viewingKey: noteAccess.viewingKey,
        note: {
            hash: note.noteHash,
            asset: {
                address: asset.registryOwner,
                linkedTokenAddress: asset.linkedTokenAddress,
                scalingFactor: asset.scalingFactor,
                canAdjustSupply: asset.canAdjustSupply,
                canConvert: asset.canConvert,
            },
            owner: {
                address: note.owner,
            },
        },
    },
});


export default async function fetchNotesFromIndexedDB({
    account,
    lastSynced,
    networkId,
    onError,
} = {}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }
    const networkOptions = {
        networkId,
    };

    const notes = await Note.query(networkOptions).where('blockNumber').above(lastSynced).toArray();
    const assetsKeys = notes.map(({ asset }) => asset);
    const noteAccessKeys = assetsKeys.map(assetAddress => getNoteAccessId(account, assetAddress));

    // Since v3.0.0-alpha.8
    // const assets = await Asset.bulkGet(networkOptions, assetsKeys);
    // const acesses = await NoteAccess.bulkGet(networkOptions, noteAccessKeys);

    const noteLogs = [];
    for (let i = 0; i < notes.length; i += 1) {
        const note = notes[i];
        const assetKey = assetsKeys[i];
        const noteAccessKey = noteAccessKeys[i];

        if (assetKey && noteAccessKey) {
            const asset = await Asset.get(networkOptions, { registryOwner: assetKey }); // eslint-disable-line no-await-in-loop
            const access = await NoteAccess.get(networkOptions, noteAccessKey); // eslint-disable-line no-await-in-loop
            noteLogs.push(packNote(note, access, asset));
        }
    }

    return noteLogs.map(({
        noteAccess: {
            note,
            ...noteAccess
        },
        ...rest
    }) => ({
        ...noteAccess,
        ...note,
        ...rest,
    }));
}
