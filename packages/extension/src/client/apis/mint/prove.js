import query from '~client/utils/query';

export default async function proveMint({
    transactions,
    from,
    sender,
    assetAddress,
    numberOfOutputNotes,
}) {
    const data = await query({
        type: 'constructProof',
        args: {
            proofType: 'MINT_PROOF',
            transactions,
            from,
            assetAddress,
            sender,
            numberOfOutputNotes,
        },
    }) || {};


    return data;
}
