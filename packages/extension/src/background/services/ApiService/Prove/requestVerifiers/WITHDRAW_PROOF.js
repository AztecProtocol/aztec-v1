import Web3Service from '~/helpers/Web3Service';
import NoteService from '~/background/services/NoteService';

export default async function verifyWithdrawRequest({
    assetAddress,
    transactions,
    numberOfInputNotes,
}) {
    const {
        networkId,
        account: {
            address,
        },
    } = Web3Service;

    const totalAmount = transactions
        .reduce((sum, { amount }) => sum + amount, 0);

    let error = null;
    try {
        const resp = await NoteService.validatePick(
            networkId,
            address,
            assetAddress,
            totalAmount,
            {
                numberOfNotes: numberOfInputNotes,
            },
        );
        if (resp && resp.error) {
            error = resp;
        }
    } catch (e) {
        error = e;
    }

    return error;
}
