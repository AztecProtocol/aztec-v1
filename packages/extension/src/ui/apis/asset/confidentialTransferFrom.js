import ConnectionService from '~ui/services/ConnectionService';

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
    proofId,
}) {
    const proofData = proof.encodeABI('0xcF217475D84997E9c0EbA3052E1F818916fE3eEC');
    const response = await ConnectionService.sendTransaction({
        contract: 'IZkAsset',
        contractAddress: assetAddress,
        method: 'confidentialTransferFrom',
        data: [
            proofId,
            proofData,
        ],
    });

    return response;
}
