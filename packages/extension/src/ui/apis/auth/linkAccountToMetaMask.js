import ConnectionService from '~/ui/services/ConnectionService';

export default async function linkAccountToMetaMask({
    address,
    linkedPublicKey,
}) {
    const {
        publicKey: spendingPublicKey,
        signature,
    } = await ConnectionService.post({
        action: 'metamask.register.extension',
        data: {
            address,
            linkedPublicKey,
        },
    }) || {};

    return {
        spendingPublicKey,
        signature,
    };
}
