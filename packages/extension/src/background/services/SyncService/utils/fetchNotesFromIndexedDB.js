import Asset from '~background/database/models/asset';
import Note from '~background/database/models/note';
import NoteAccess from '~background/database/models/noteAccess';
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
    const noteAccessKeys = assetsKeys.map(assetKey => `${assetKey}_${account}`);

    // Since v3.0.0-alpha.8
    // const assets = await Asset.bulkGet(networkOptions, assetsKeys);
    // const acesses = await NoteAccess.bulkGet(networkOptions, noteAccessKeys);

    const data = [];
    for (let i = 0; i < notes.length; i += 1) {
        const note = notes[i];
        const assetKey = assetsKeys[i];
        const noteAccessKey = noteAccessKeys[i];

        // TODO: Why assetKey && noteAccessKey is null for owner in demo scripts?
        if (assetKey && noteAccessKey) {
            const asset = await Asset.get(networkOptions, assetKey); // eslint-disable-line no-await-in-loop
            const acess = await NoteAccess.get(networkOptions, noteAccessKey); // eslint-disable-line no-await-in-loop
            data.push(packNote(note, acess, asset));
        }
    }

    const {
        noteLogs = [],
    } = data || {};

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
