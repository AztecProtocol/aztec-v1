import ConnectionService from '~ui/services/ConnectionService';

export default async function send({
    assetAddress,
    proof,
    signatures = '0x',
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: 'ZkAsset',
        contractAddress: assetAddress,
        method: 'confidentialTransfer',
        data: [
            proofData,
            signatures,
        ],
    });

    return response;
}
