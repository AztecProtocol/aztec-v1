import {
    userAccount,
} from '~helpers/testUsers';
import {
    REAL_VIEWING_KEY_LENGTH,
} from '~config/constants';
import * as storage from '~utils/storage';
import {
    createNote,
} from '~utils/note';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import AuthService from '~background/services/AuthService';
import decryptViewingKey from '../decryptViewingKey';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('decryptViewingKey', () => {
    const noteValue = 10;
    let viewingKey;

    beforeAll(async () => {
        const {
            address,
            linkedPublicKey,
            spendingPublicKey,
        } = userAccount;
        const note = await createNote(noteValue, spendingPublicKey, address);
        const {
            viewingKey: realViewingKey,
        } = note.exportNote();
        viewingKey = await encryptedViewingKey(linkedPublicKey, realViewingKey)
            .toHexString();
    });

    it('get credentials from storage to decrypt input viewingKey', async () => {
        await storyOf('ensureDomainPermission');
        const response = await decryptViewingKey(viewingKey, userAccount.address);
        expect(response.length).toBe(REAL_VIEWING_KEY_LENGTH + 2);
    });

    it('return empty string if there is no keyStore in storage', async () => {
        const response = await decryptViewingKey(viewingKey, userAccount.address);
        expect(response).toBe('');

        const keyStore = await AuthService.getKeyStore();
        expect(keyStore).toBe(null);
    });

    it('return empty string if account has logged out', async () => {
        await storyOf('ensureDomainPermission');
        await AuthService.logout();

        const response = await decryptViewingKey(viewingKey, userAccount.address);
        expect(response).toBe('');

        const keyStore = await AuthService.getKeyStore();
        expect(keyStore).not.toBe(null);

        const session = await AuthService.getSession(userAccount.address);
        expect(session).toBe(null);
    });

    it('return empty string if credentials is wrong', async () => {
        await storyOf('ensureDomainPermission');

        const getPwDeriveKeySpy = jest.spyOn(AuthService, 'getSession')
            .mockImplementation(() => ({
                pwDerivedKey: new Uint8Array([0, 1, 2, 3]),
            }));

        const response = await decryptViewingKey(viewingKey, userAccount.address);
        expect(response).toBe('');

        getPwDeriveKeySpy.mockRestore();
    });
});
