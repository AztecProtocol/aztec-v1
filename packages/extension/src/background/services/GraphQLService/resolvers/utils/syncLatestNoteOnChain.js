import Asset from '~background/database/models/asset';
import EventService from '~background/services/EventService';
import {
    errorLog,
} from '~utils/log';

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

export default async function syncLatestNoteOnChain({
    noteId: noteHash,
    account,
    networkId,
}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const {
        note: onChainNote,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    });

    let noteAccesses = [];
    if (onChainNote) {
        const asset = await Asset.get({ networkId }, { registryOwner: onChainNote.asset });
        const {
            access,
        } = onChainNote;

        noteAccesses = Object.keys(access).map(address => packNote(onChainNote, asset, {
            address,
            viewingKey: access[address],
        }));
    }

    return noteAccesses.map(({
        note,
        ...rest
    }) => ({
        ...rest,
        ...note,
    }));
}
