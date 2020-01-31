import ConnectionService from '~/ui/services/ConnectionService';

export default async function deposit({
    currentAccount: {
        address: currentAddress,
    },
    erc20Amount,
    assetAddress,
    proof,
    isGSNAvailable,
}) {
    const proofHash = proof.hash;
    const proofData = proof.encodeABI(assetAddress);

    const transactionData = {
        contract: 'AccountRegistry',
        method: 'deposit',
        data: [
            assetAddress,
            currentAddress,
            proofHash,
            proofData,
            erc20Amount.toString(),
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
