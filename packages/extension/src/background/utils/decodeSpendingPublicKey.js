import secp256k1 from '@aztec/secp256k1';
import decodeKeyStore from './decodeKeyStore';

export default function decodeSpendingPublicKey(keyStore, pwDerivedKey) {
    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const privateKey = decodedKeyStore.exportPrivateKey(pwDerivedKey);

    const spendingKey = secp256k1.ec.keyFromPrivate(privateKey);

    return `0x${spendingKey.getPublic(true, 'hex')}`;
}
