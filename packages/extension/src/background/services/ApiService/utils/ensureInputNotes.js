import Web3Service from '~/helpers/Web3Service';
import NoteService from '~/background/services/NoteService';

export default async function ensureInputNotes({
    assetAddress,
    numberOfInputNotes,
    amount,
}) {
    const {
        networkId,
        account: {
            address,
        },
    } = Web3Service;

    let errorResponse = null;
    try {
        const resp = await NoteService.validatePick(
            networkId,
            address,
            assetAddress,
            amount,
            {
                numberOfNotes: numberOfInputNotes,
            },
        );
        if (resp && resp.error) {
            errorResponse = resp;
        }
    } catch (e) {
        errorResponse = e;
    }

    return errorResponse;
}
