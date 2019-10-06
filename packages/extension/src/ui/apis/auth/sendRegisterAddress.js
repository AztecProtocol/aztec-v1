import ConnectionService from '~ui/services/ConnectionService';

export default async function sendRegisterAddress({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) {
    const {
        txReceipt,
    } = ConnectionService.sendTransaction({
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
    };
}
