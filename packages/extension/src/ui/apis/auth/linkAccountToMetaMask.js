import secp256k1 from '@aztec/secp256k1';
import decodePrivateKey from '~/background/utils/decodePrivateKey';
import ConnectionService from '~/ui/services/ConnectionService';

export default async function linkAccountToMetaMask({
    address,
    linkedPublicKey,
    keyStore,
    pwDerivedKey,
}) {
    const privateKey = '0x'.concat(decodePrivateKey(keyStore, pwDerivedKey));
    const {
        address: aliasAddress,
    } = secp256k1.accountFromPrivateKey(privateKey);
    const {
        publicKey: spendingPublicKey,
        signature,
        error,
    } = await ConnectionService.post({
        action: 'metamask.register.extension',
        data: {
            address,
            linkedPublicKey,
            aliasAddress,
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
