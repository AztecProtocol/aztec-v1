import ConnectionService from '~/ui/services/ConnectionService';

export default async function confidentialTransfer({
    assetAddress,
    proof,
    signatures,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const {
        success,
        error,
    } = await ConnectionService.post({
        action: 'metamask.send',
        data: {
            contract: 'ZkAsset',
            at: assetAddress,
            method: 'confidentialTransfer',
            data: [
                proofData,
                signatures,
            ],
        },
    }) || {};

    return {
        success,
        error,
    };
}
