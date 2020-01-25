import ConnectionService from '~/ui/services/ConnectionService';

export default async function confidentialTransferFrom({
    assetAddress,
    proof,
    noteHashes = [],
    spender,
    spenderApprovals = [],
    signature = '0x',
    sender,
}) {
    const proofData = proof.encodeABI(assetAddress);
    const response = await ConnectionService.sendTransaction({
        contract: 'AccountRegistry',
        method: 'confidentialTransferFrom',
        data: [
            assetAddress,
            proofData,
            noteHashes,
            spender || sender,
            spenderApprovals,
            signature,
        ],
    });

    return {
        ...response,
        success: !!(response && response.txReceipt),
    };
}
