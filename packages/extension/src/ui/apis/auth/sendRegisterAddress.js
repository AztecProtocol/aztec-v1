import ConnectionService from '~/ui/services/ConnectionService';

export default async function sendRegisterAddress({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) {
    const {
        txReceipt,
        error,
    } = await ConnectionService.post({
        action: 'metamask.aztec.registerAZTECExtension',
        data: {
            address,
            linkedPublicKey,
            spendingPublicKey,
            signature,
        },
    }) || {};

    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
        error,
    };
}
