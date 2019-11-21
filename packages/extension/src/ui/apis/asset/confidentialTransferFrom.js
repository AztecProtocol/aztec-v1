import ConnectionService from '~ui/services/ConnectionService';

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: 'AZTECAccountRegistry',
        method: 'confidentialTransferFrom',
        data: [
            assetAddress,
            proofData,
        ],
    });

    return response;
}
