import asyncMap from '~/utils/asyncMap';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';
import settings from '~/background/utils/settings';
import getViewingKeyFromMetadata from './getViewingKeyFromMetadata';

export default async function pickNotesFromBalance(args) {
    const {
        assetId,
        amount,
        owner,
        numberOfNotes,
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
            numberOfNotes: numberOfNotes || await settings('NUMBER_OF_INPUT_NOTES'),
        },
    );

    return asyncMap(notes, async note => ({
        ...note,
        viewingKey: await getViewingKeyFromMetadata(note.metadata),
    }));
}
