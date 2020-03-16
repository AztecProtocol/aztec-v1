import secp256k1 from '@aztec/secp256k1';
import AuthService from '~/background/services/AuthService';
import decodePrivateKey from '~/background/utils/decodePrivateKey';

export default async function getAccountKeys() {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession();
    const privateKey = '0x'.concat(decodePrivateKey(keyStore, pwDerivedKey));
    const {
        address: AZTECaddress,
    } = secp256k1.accountFromPrivateKey(privateKey);
    const linkedPublicKey = keyStore.privacyKeys.publicKey;

    return {
        keyStore,
        pwDerivedKey,
        AZTECaddress,
        linkedPublicKey,
    };
}
