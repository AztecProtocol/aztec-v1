import asyncMap from '~/utils/asyncMap';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';
import getViewingKeyFromMetadata from './getViewingKeyFromMetadata';

export default async function pickNotesFromBalance(args) {
    const {
        assetAddress,
        owner,
        equalTo,
        greaterThan,
        lessThan,
        numberOfNotes,
    } = args;
    const {
        networkId,
        account: {
            address: currentAddress,
        },
    } = Web3Service;

    const notes = await NoteService.fetch(
        networkId,
        owner || currentAddress,
        assetAddress,
        {
            equalTo,
            greaterThan,
            lessThan,
            numberOfNotes,
        },
    );

    return asyncMap(notes, async note => ({
        ...note,
        viewingKey: await getViewingKeyFromMetadata(note.metadata),
    }));
}
