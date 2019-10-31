import Web3Service from '~/client/services/Web3Service';
import query from '~client/utils/query';

export default async function proveWithdraw({
    assetAddress,
    transactions,
    sender,
    numberOfInputNotes,
}) {
    const {
        address,
    } = Web3Service.account;

    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'WITHDRAW_PROOF',
            assetAddress,
            transactions,
            sender: sender || address,
            numberOfInputNotes,
        },
    }) || {};

    return data;
}
