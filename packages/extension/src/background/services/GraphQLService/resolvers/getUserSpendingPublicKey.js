import secp256k1 from '@aztec/secp256k1';
import AuthService from '~backgroundServices/AuthService';

export default async function getUserSpendingPublicKey(userAddress) {
    // TODO
    // should be able to get the following data directly from AuthService
    const {
        keyStore,
        session: {
            pwDerivedKey,
        },
    } = await AuthService.validateSession(userAddress);
    const privateKey = keyStore.exportPrivateKey(pwDerivedKey);
    const spendingKey = secp256k1.ec.keyFromPrivate(privateKey);

    return `0x${spendingKey.getPublic(true, 'hex')}`;
}
