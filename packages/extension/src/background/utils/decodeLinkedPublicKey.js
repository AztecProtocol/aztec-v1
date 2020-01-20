import decodeKeyStore from './decodeKeyStore';

export default function decodeLinkedPublicKey(keyStore, pwDerivedKey) {
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    return decodedKeyStore.privacyKeys.publicKey;
}
