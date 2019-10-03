import ConnectionService from '~ui/services/ConnectionService';

export default async function approve({
    amount,
    proof,
    assetAddress,
}) {
    const response = await ConnectionService.post({
        action: 'metamask.ace.publicApprove',
        data: {
            amount,
            proofHash: proof.hash,
            assetAddress,
        },
    });

    return response;
}
