import ConnectionService from '~ui/services/ConnectionService';

export default async function linkAccountToMetaMask(account) {
    const {
        publicKey: spendingPublicKey,
        ...data
    } = await ConnectionService.post({
        action: 'metamask.register.extension',
        data: account,
    }) || {};
    console.log(account);

    return {
        ...data,
        ...account,
        spendingPublicKey,
    };
}
