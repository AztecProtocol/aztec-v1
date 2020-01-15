import { randomHex } from 'web3-utils';
import { userAccount } from './helpers/testUsers';
import { encryptMessage, decryptMessage, fromHexString } from '../src/crypto';
import lengthConfig from '../src/crypto/lengthConfig';

const { linkedPublicKey: publicKey, linkedPrivateKey: privateKey } = userAccount;

describe('encryptMessage', () => {
    it('take publicKey and message and return an EncryptedMessage object', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        expect(Object.keys(encrypted).sort()).toEqual(['decrypt', 'export', 'toHexString']);

        const encryptedObj = encrypted.export();
        expect(Object.keys(encryptedObj).sort()).toEqual(['ciphertext', 'ephemPublicKey', 'nonce']);

        const encryptedHex = encrypted.toHexString();
        expect(encryptedHex).toMatch(/^0x[0-9a-f]{1,}$/i);
    });

    it('not likely to generate two encrypted message with the same input', () => {
        const message = '0';
        const encrypted0 = encryptMessage(publicKey, message);
        const encrypted1 = encryptMessage(publicKey, message);
        expect(encrypted0.export().ciphertext).not.toBe(encrypted1.export().ciphertext);
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

describe('fromHexString', () => {
    it('generate an EncryptedMessage object from string', () => {
        const message = 'my secret';
        const encrypted = encryptMessage(publicKey, message);
        const encryptedStr = encrypted.toHexString();
        const recovered = fromHexString(encryptedStr);
        expect(recovered.export()).toEqual(encrypted.export());
    });

    it('return null if the input string does not reach a minimum length', () => {
        const warnings = [];
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation((...message) => warnings.push(message));

        const minLen = Object.values(lengthConfig).reduce((accum, len) => accum + len, 0);

        const encrypted = fromHexString(randomHex(minLen / 2));
        expect(encrypted.decrypt(privateKey)).toBe('');
        expect(warnSpy).not.toHaveBeenCalled();

        const invalid = fromHexString(randomHex((minLen - 2) / 2));
        expect(invalid).toBe(null);
        expect(warnSpy).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
    });
});
