import {
    userAccount,
} from '~helpers/testData';
import {
    randomId,
} from '~utils/random';
import {
    encryptMessage,
    decryptMessage,
    batchDecrypt,
    fromHexString,
} from '../crypto';
import nacl from '../crypto/nacl';
import lengthConfig from '../crypto/lengthConfig';

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

describe('batchDecrypt', () => {
    it('decrypt multiple EncryptedMessage objects', () => {
        const fromSecretKeySpy = jest.spyOn(nacl.box.keyPair, 'fromSecretKey');
        const messages = [
            'my secret',
            'my second secret',
            'my last secret',
        ];
        const encryptedData = messages.map(message => encryptMessage(publicKey, message));
        const recovered = batchDecrypt(privateKey, encryptedData);
        expect(recovered).toEqual(messages);
        expect(fromSecretKeySpy).toHaveBeenCalledTimes(1);
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
        const warnSpy = jest.spyOn(console, 'warn')
            .mockImplementation((...message) => warnings.push(message));

        const minLen = Object.values(lengthConfig)
            .reduce((accum, len) => accum + len, 0);

        const encrypted = fromHexString(randomId(minLen));
        expect(encrypted.decrypt(privateKey)).toBe('');
        expect(warnSpy.mock.calls.length).toBe(0);

        const invalid = fromHexString(randomId(minLen - 1));
        expect(invalid).toBe(null);
        expect(warnSpy.mock.calls.length).toBe(1);

        warnSpy.mockRestore();
    });
});
