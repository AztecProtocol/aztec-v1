import asyncMap from '~/utils/asyncMap';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';
import getViewingKeyFromMetadata from './getViewingKeyFromMetadata';

export default async function pickNotesFromBalance(args) {
    const {
        assetId,
        amount,
        owner,
        numberOfNotes,
        excludedNotes = null,
    } = args;
    const {
        networkId,
        account: {
            address: currentAddress,
        },
    } = Web3Service;

    const notes = await NoteService.pick(
        networkId,
        owner || currentAddress,
        assetId,
        amount,
        {
            numberOfNotes,
            excludedNotes,
        },
    );

    return asyncMap(notes, async note => ({
        ...note,
        viewingKey: await getViewingKeyFromMetadata(note.metadata),
    }));
}
