import AuthService from '~/background/services/AuthService';

export default async function registerAddress({
    address,
    linkedPublicKey,
    spendingPublicKey,
    blockNumber,
}) {
    return AuthService.registerAddress({
        address,
        linkedPublicKey,
        spendingPublicKey,
        blockNumber,
    });
}
