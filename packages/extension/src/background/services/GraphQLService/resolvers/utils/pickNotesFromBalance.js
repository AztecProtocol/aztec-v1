import NoteService from '~background/services/NoteService';
import settings from '~background/utils/settings';

export default async function pickNotesFromBalance(args, ctx) {
    const {
        assetId,
        amount,
        owner,
        numberOfNotes,
    } = args;
    const {
        address: userAddress,
        networkId,
    } = ctx;

    return NoteService.pick(
        networkId,
        owner || userAddress,
        assetId,
        amount,
        {
            numberOfNotes: numberOfNotes || await settings('NUMBER_OF_INPUT_NOTES'),
        },
    );
}
