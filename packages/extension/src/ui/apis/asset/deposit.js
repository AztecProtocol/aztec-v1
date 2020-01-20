import ConnectionService from '~/ui/services/ConnectionService';

export default async function deposit({
    currentAccount: {
        address: currentAddress,
    },
    assetAddress,
    proof,
    amount,
    isGSNAvailable,
}) {
    const proofHash = proof.hash;
    const proofData = proof.encodeABI(assetAddress);

    const transactionData = {
        contract: 'AZTECAccountRegistry',
        method: 'deposit',
        data: [
            assetAddress,
            currentAddress,
            proofHash,
            proofData,
            amount,
        ],
    };

    const response = isGSNAvailable
        ? await ConnectionService.sendTransaction(transactionData)
        : await ConnectionService.post({
            action: 'metamask.send',
            data: transactionData,
        });

    return {
        ...response,
        success: !!(response && response.txReceipt),
    };
}
