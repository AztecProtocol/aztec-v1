import ConnectionService from '~/ui/services/ConnectionService';

export default async function linkAccountToMetaMask({
    address,
    linkedPublicKey,
}) {
    const {
        publicKey: spendingPublicKey,
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.register.extension',
        data: {
            address,
            linkedPublicKey,
        },
    }) || {};

    if (error) {
        return {
            error,
        };
    }

    return {
        spendingPublicKey,
        signature,
    };
}
