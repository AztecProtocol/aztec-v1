import Web3Service from '~/client/services/Web3Service';
import query from '~client/utils/query';

export default async function proveDeposit({
    assetAddress,
    transactions,
    from,
    sender,
    numberOfOutputNotes,
}) {
    const {
        address,
    } = Web3Service.account;

    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'DEPOSIT_PROOF',
            assetAddress,
            transactions,
            from: from || address,
            sender: sender || address,
            numberOfOutputNotes,
        },
    }) || {};

    return data;
}
