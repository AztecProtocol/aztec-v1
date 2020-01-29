import {
    permissionError,
} from '~/utils/error';
import {
    KeyStore,
} from '~/utils/keyvault';

export default function decodeKeyStore(keyStore, pwDerivedKey) {
    if (keyStore instanceof KeyStore) {
        return keyStore;
    }

    const decodedKeyStore = KeyStore.deserialize(keyStore, pwDerivedKey);

    if (!decodedKeyStore.isDerivedKeyCorrect(pwDerivedKey)) {
        throw permissionError('account.incorrect.password');
    }

    return decodedKeyStore;
}
