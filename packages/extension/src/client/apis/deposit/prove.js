import query from '~client/utils/query';

export default async function proveDeposit({
    transactions,
    from,
    sender,
    assetAddress,
    numberOfOutputNotes,
}) {
    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'DEPOSIT_PROOF',
            transactions,
            from,
            assetAddress,
            sender,
            numberOfOutputNotes,
        },
    }) || {};


    return data;
}
