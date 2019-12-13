import ConnectionService from '~ui/services/ConnectionService';

export default async function deposit({
    assetAddress,
    proof,
    amount,
}) {
    const proofHash = proof.hash;
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.post({
        action: 'metamask.send',
        data: {
            contract: 'AZTECAccountRegistry',
            method: 'deposit',
            data: [
                assetAddress,
                proofHash,
                proofData,
                amount,
            ],
        },
    });

    return {
        ...response,
        success: !!(response && response.txReceipt),
    };
}
