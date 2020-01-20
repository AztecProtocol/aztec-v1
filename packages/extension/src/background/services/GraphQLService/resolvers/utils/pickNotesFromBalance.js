import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';
import settings from '~/background/utils/settings';

export default async function pickNotesFromBalance(args, ctx) {
    const {
        assetId,
        amount,
        owner,
        numberOfNotes,
    } = args;
    const {
        address: userAddress,
    } = ctx;

    return NoteService.pick(
        Web3Service.networkId,
        owner || userAddress,
        assetId,
        amount,
        {
            numberOfNotes: numberOfNotes || await settings('NUMBER_OF_INPUT_NOTES'),
        },
    );
}
