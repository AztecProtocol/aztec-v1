import ConnectionService from '~/ui/services/ConnectionService';

export default async function sendGSNRegisterTx({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) {
    const {
        txReceipt,
        error,
    } = await ConnectionService.sendTransaction({
        contract: 'AZTECAccountRegistry',
        method: 'registerAZTECExtension',
        data: [
            address,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        ],
    }) || {};

    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
        error,
    };
}
