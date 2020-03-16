import secp256k1 from '@aztec/secp256k1';
import {
    KeyStore,
} from '~/utils/keyvault';
import decodePrivateKey from '~/background/utils/decodePrivateKey';

export default async function createKeyStore({
    pwDerivedKey,
    seedPhrase,
    salt = 'salty',
}) {
    const keyStore = new KeyStore({
        pwDerivedKey,
        salt,
        mnemonic: seedPhrase,
        hdPathString: "m/44'/60'/0'/0",
    });
    const linkedPublicKey = keyStore.privacyKeys.publicKey;
    const privateKey = '0x'.concat(decodePrivateKey(keyStore, pwDerivedKey));
    const {
        address: AZTECaddress,
    } = secp256k1.accountFromPrivateKey(privateKey);

    return {
        keyStore,
        linkedPublicKey,
        AZTECaddress,
    };
}
