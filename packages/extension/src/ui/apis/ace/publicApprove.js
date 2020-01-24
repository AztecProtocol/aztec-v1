import ConnectionService from '~/ui/services/ConnectionService';

export default async function publicApprove({
    amount,
    proof,
    assetAddress,
}) {
    const response = await ConnectionService.post({
        action: 'metamask.send',
        data: {
            contract: 'ACE',
            method: 'publicApprove',
            data: [
                assetAddress,
                proof.hash,
                amount,
            ],
        },
    });

    return response;
}
