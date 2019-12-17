import Asset from '~background/database/models/asset';
import EventService from '~background/services/EventService';
import Web3Service from '~/helpers/Web3Service';
import {
    errorLog,
} from '~utils/log';

const packNote = (note, asset) => ({
    ...note,
    asset: {
        ...asset,
        address: asset.registryOwner,
    },
    owner: {
        address: note.owner,
    },
});

export default async function syncLatestNoteOnChain({
    noteId: noteHash,
    account,
}) {
    if (!account) {
        errorLog("'account' cannot be empty");
        return [];
    }

    const {
        networkId,
    } = Web3Service;

    const {
        note: onChainNote,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    });

    if (!onChainNote) {
        return null;
    }

    const asset = await Asset.get({ networkId }, { registryOwner: onChainNote.asset });

    return packNote(onChainNote, asset);
}
