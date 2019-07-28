import {
    encryptMessage,
    decryptMessage,
} from '../crypto';
import generateTestingKeys from './generateTestingKeys';

let publicKey;
let privateKey;

beforeAll(async () => {
    ({
        publicKey,
        privateKey,
    } = await generateTestingKeys());
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
