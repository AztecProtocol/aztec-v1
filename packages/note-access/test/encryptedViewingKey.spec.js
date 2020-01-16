import { randomHex } from 'web3-utils';
import { userAccount } from './helpers/testUsers';
import { REAL_VIEWING_KEY_LENGTH, VIEWING_KEY_LENGTH } from '../src/config/constants';
import encryptedViewingKey, { fromHexString } from '../src/encryptedViewingKey';
import lengthConfig from '../src/encryptedViewingKey/lengthConfig';

const { linkedPublicKey: publicKey, linkedPrivateKey: privateKey } = userAccount;

describe('encryptedViewingKey', () => {
    let warnings = [];
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation((message) => warnings.push(message));

    beforeEach(() => {
        warnSpy.mockClear();
        warnings = [];
    });

    const realViewingKey = randomHex(REAL_VIEWING_KEY_LENGTH / 2);

    it('encrypt real viewing key and return an EncryptedMessage object', () => {
        const encrypted = encryptedViewingKey(publicKey, realViewingKey);
        expect(Object.keys(encrypted).sort()).toEqual(['decrypt', 'export', 'toHexString']);

        const viewingKeyData = encrypted.export();
        expect(Object.keys(viewingKeyData).sort()).toEqual(['ciphertext', 'ephemPublicKey', 'nonce']);
        Object.keys(viewingKeyData).forEach((key) => {
            expect(viewingKeyData[key].length).toBe(lengthConfig[key] + 2);
        });

        const viewingKeyString = encrypted.toHexString();
        expect(viewingKeyString).toMatch(/^0x[0-9a-z]+$/i);
        expect(viewingKeyString.length).toBe(VIEWING_KEY_LENGTH + 2);

        const recovered = encrypted.decrypt(privateKey);
        expect(recovered).toBe(realViewingKey);

        expect(warnings.length).toBe(0);
    });

    it('return null if input viewing key has wrong size', () => {
        const wrongViewingKey = `0x${randomHex(REAL_VIEWING_KEY_LENGTH - 2)}`;
        const viewingKey = encryptedViewingKey(publicKey, wrongViewingKey);
        expect(viewingKey).toBe(null);
        expect(warnings.length).toBe(1);
    });

    it('generate an encrypted object from encrypted hex string', () => {
        const encrypted = encryptedViewingKey(publicKey, realViewingKey);
        const viewingKeyString = encrypted.toHexString();

        const newEncrypted = fromHexString(viewingKeyString);
        expect(newEncrypted).not.toBe(encrypted);
        expect(newEncrypted.export()).toEqual(encrypted.export());

        const recoverd = newEncrypted.decrypt(privateKey);
        expect(recoverd).toBe(realViewingKey);

        expect(warnings.length).toBe(0);
    });
});
