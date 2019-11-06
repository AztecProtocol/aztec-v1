import ConnectionService from '~ui/services/ConnectionService';

export default async function sendRegisterAddress({
    address,
    linkedPublicKey,
    spendingPublicKey,
    signature,
}) {
    console.log({
        address,
        linkedPublicKey,
        spendingPublicKey,
        signature,

    });
    const {
        txReceipt,
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
    console.log({ txReceipt });
    const {
        blockNumber,
    } = txReceipt || {};

    return {
        blockNumber,
    };
}
