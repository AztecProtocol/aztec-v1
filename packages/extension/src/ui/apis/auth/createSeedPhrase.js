import {
    KeyStore,
} from '~/utils/keyvault';

export default function createSeedPhrase() {
    return {
        seedPhrase: KeyStore.generateRandomSeed(Date.now().toString()),
    };
}
