import query from '~client/utils/query';

export default async function proveSend({
    transactions,
    from,
    sender,
    assetAddress,
    numberOfOutputNotes,
}) {
    console.log({

        transactions,
        from,
        sender,
        assetAddress,
        numberOfOutputNotes,
    });
    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'TRANSFER_PROOF',
            transactions,
            from,
            assetAddress,
            sender,
            numberOfOutputNotes,
        },
    }) || {};

    return data;
}
