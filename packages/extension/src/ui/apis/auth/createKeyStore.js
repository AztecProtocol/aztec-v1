import {
    KeyStore,
} from '~/utils/keyvault';

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

    return {
        keyStore,
        linkedPublicKey,
    };
}
