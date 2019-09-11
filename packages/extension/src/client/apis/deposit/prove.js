import query from '~client/utils/query';

export default async function proveDeposit({
    transactions,
    from,
    sender,
    numberOfOutputNotes,
}) {
    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'DEPOSIT_PROOF',
            transactions,
            from,
            sender,
            numberOfOutputNotes,
        },
    }) || {};

    return data;
}
