import query from '~client/utils/query';

export default async function proveWithdraw({
    amount,
    from,
    sender,
    assetAddress,
    numberOfInputNotes,
    numberOfOutputNotes,
}) {
    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'WITHDRAW_PROOF',
            from,
            amount,
            assetAddress,
            sender,
            numberOfInputNotes,
            numberOfOutputNotes,
        },
    }) || {};

    return data;
}
