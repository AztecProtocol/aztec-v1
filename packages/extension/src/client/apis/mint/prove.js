import ConnectionService from '~/client/services/ConnectionService';

export default async function proveMint({
    transactions,
    from,
    sender,
    assetAddress,
    numberOfOutputNotes,
}) {
    const data = await ConnectionService.query(
        'constructProof',
        {
            proofType: 'MINT_PROOF',
            transactions,
            from,
            assetAddress,
            sender,
            numberOfOutputNotes,
        },
    ) || {};


    return data;
}
