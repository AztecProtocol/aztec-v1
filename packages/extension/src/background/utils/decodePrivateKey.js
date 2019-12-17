import {
    utils as keyvaultUtils,
} from '~/utils/keyvault';
import decodeKeyStore from './decodeKeyStore';

export default function decodePrivateKey(keyStore, pwDerivedKey) {
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const {
        encPrivKey,
    } = decodedKeyStore.privacyKeys;

    return keyvaultUtils.decryptString(encPrivKey, pwDerivedKey);
}
