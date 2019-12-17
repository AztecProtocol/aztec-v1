import ConnectionService from '~/ui/services/ConnectionService';


export default async function batchConfidentialTransfer({
    assetAddress,
    proof,
    signature,
    noteHashes,
    spender,
    spenderApprovals,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.post({
        action: 'metamask.zkAsset.batchConfidentialTransfer',
        data: {
            proofData,
            assetAddress,
            signature,
            noteHashes,
            spender,
            spenderApprovals,
        },
    });

    return response;
}
