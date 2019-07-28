import { stub } from 'sinon';
import {
    REAL_VIEWING_KEY_LENGTH,
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import {
    randomId,
} from '~utils/random';
import generateTestingKeys from './generateTestingKeys';
import encryptedViewingKey, {
    fromHexString,
} from '../encryptedViewingKey';
import lengthConfig from '../encryptedViewingKey/lengthConfig';

describe('encryptedViewingKey', () => {
    let publicKey;
    let privateKey;
    let consoleStub;
    let warnings = [];

    beforeAll(async () => {
        ({
            publicKey,
            privateKey,
        } = await generateTestingKeys());
    });

    beforeEach(() => {
        warnings = [];
        consoleStub = stub(console, 'warn');
        consoleStub.callsFake(message => warnings.push(message));
    });

    afterEach(() => {
        consoleStub.restore();
    });

    const realViewingKey = `0x${randomId(REAL_VIEWING_KEY_LENGTH)}`;

    it('encrypt real viewing key and return an EncryptedMessage object', () => {
        const encrypted = encryptedViewingKey(publicKey, realViewingKey);
        expect(Object.keys(encrypted).sort()).toEqual([
            'decrypt',
            'export',
            'toHexString',
        ]);

        const viewingKeyData = encrypted.export();
        expect(Object.keys(viewingKeyData).sort()).toEqual([
            'ciphertext',
            'ephemPublicKey',
            'nonce',
        ]);
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
        const wrongViewingKey = `0x${randomId(REAL_VIEWING_KEY_LENGTH - 2)}`;
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
