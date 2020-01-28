import AuthService from '~/background/services/AuthService';
import decodeSpendingPublicKey from '~/background/utils/decodeSpendingPublicKey';

export default async function getUserSpendingPublicKey() {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession();

    return decodeSpendingPublicKey(keyStore, pwDerivedKey);
}
