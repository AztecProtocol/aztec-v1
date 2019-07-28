import {
    KeyStore,
    utils as keyvaultUtils,
} from '~utils/keyvault';
import {
    randomId,
} from '~utils/random';
import {
    encryptMessage,
    decryptMessage,
} from '../crypto';

let publicKey;
let privateKey;

beforeAll(async () => {
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

    let encPrivKey;
    ({
        publicKey,
        encPrivKey,
    } = keyStore.privacyKeys);
    privateKey = keyvaultUtils.decryptString(encPrivKey, pwDerivedKey);
});

describe('encryptMessage', () => {
    it('take publicKey and message and return an EncryptedMessage object', () => {
        const massage = 'my secret';
        const encrypted = encryptMessage(publicKey, massage);
        expect(Object.keys(encrypted).sort()).toEqual([
            'export',
            'toHexString',
        ]);

        const encryptedObj = encrypted.export();
        expect(Object.keys(encryptedObj).sort()).toEqual([
            'ciphertext',
            'ephemPublicKey',
            'nonce',
        ]);

        const encryptedHex = encrypted.toHexString();
        expect(encryptedHex).toMatch(/^0x[0-9a-f]{1,}$/i);
    });
});

describe('decryptMessage', () => {
    it('take an EncryptedMessage object and return original message', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        const recovered = decryptMessage(privateKey, encrypted);
        expect(recovered).toBe(message);
    });
});
