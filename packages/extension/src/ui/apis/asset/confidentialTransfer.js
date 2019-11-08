import ConnectionService from '~ui/services/ConnectionService';


export default async function confidentialTransfer({
    assetAddress,
    proof,
    signatures,
    useGSN = false,
}) {
    const action = useGSN ? 'gsn.zkAsset.confidentialTransfer' : 'metamask.zkAsset.confidentialTransfer';
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.post({
        action,
        data: {
            proofData,
            assetAddress,
            signatures,
        },
    });

    return response;
}
