import {
    userAccount,
} from '~helpers/testData';
import {
    encryptMessage,
    decryptMessage,
} from '../crypto';

const {
    linkedPublicKey: publicKey,
    linkedPrivateKey: privateKey,
} = userAccount;

describe('encryptMessage', () => {
    it('take publicKey and message and return an EncryptedMessage object', () => {
        const massage = 'my secret';
        const encrypted = encryptMessage(publicKey, massage);
        expect(Object.keys(encrypted).sort()).toEqual([
            'decrypt',
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
    it('call decrypt in EncryptedMessage object to get original message', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        const recovered = encrypted.decrypt(privateKey);
        expect(recovered).toBe(message);
    });

    it('take an EncryptedMessage object and return original message', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        const recovered = decryptMessage(privateKey, encrypted);
        expect(recovered).toBe(message);
    });

    it('take encrypted data object and return original message', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        const encryptedData = encrypted.export();
        const recovered = decryptMessage(privateKey, encryptedData);
        expect(recovered).toBe(message);
    });
});
