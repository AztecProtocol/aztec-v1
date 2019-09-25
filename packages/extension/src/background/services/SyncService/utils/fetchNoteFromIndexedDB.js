import Asset from '~background/database/models/asset';
import EventService from '~background/services/EventService';
import {
    errorLog,
} from '~utils/log';
import metadata from '~utils/metadata';


const packNote = (note, asset, noteAccess) => ({
    account: {
        address: noteAccess.address,
    },
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
        status: note.status,
    },
});


export default async function fetchNoteFromIndexedDB(options) {
    const {
        noteId: noteHash,
        account,
        networkId,
    } = options;

    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const {
        error,
        note: onChainNote,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    });

    let noteAccesses = [];
    if (onChainNote) {
        const asset = await Asset.get({ networkId }, { registryOwner: onChainNote.asset });
        const {
            addresses,
            viewingKeys,
        } = metadata(onChainNote.metadata);

        noteAccesses = addresses.map((address, index) => ({
            address,
            viewingKey: viewingKeys[index],
        })).map(noteAccess => packNote(onChainNote, asset, noteAccess));
    }

    return noteAccesses.map(({
        note,
        ...rest
    }) => ({
        ...rest,
        ...note,
    }));

