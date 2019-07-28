/*
 * Should implement a mock AuthService file and generate keys there
 */
import {
    KeyStore,
    utils as keyvaultUtils,
} from '~utils/keyvault';
import {
    randomId,
} from '~utils/random';

export default async function generateTestingKeys() {
    const password = 'password01';
    const salt = 'peper';
    const mnemonic = KeyStore.generateRandomSeed(randomId());

    const {
        pwDerivedKey,
    } = await KeyStore.generateDerivedKey({
        password,
        salt,
    });

    const keyStore = new KeyStore({
        pwDerivedKey,
        salt,
        mnemonic,
        hdPathString: "m/44'/60'/0'/0",
    });

    const {
        publicKey,
        encPrivKey,
    } = keyStore.privacyKeys;
    const privateKey = keyvaultUtils.decryptString(encPrivKey, pwDerivedKey);

    return {
        publicKey,
        privateKey,
    };
}
