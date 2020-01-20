import {
    userAccount,
} from '~testHelpers/testUsers';
import notes from '~testHelpers/testNotes';
import {
    randomInt,
} from '~/utils/random';
import * as storage from '~/utils/storage';
import AuthService from '~/background/services/AuthService';
import decryptViewingKey from '../decryptViewingKey';
import storyOf from './helpers/stories';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('decryptViewingKey', () => {
    let note;

    beforeEach(async () => {
        note = notes[randomInt(0, notes.length - 1)];
    });

    it('get credentials from storage to decrypt input viewingKey', async () => {
        await storyOf('ensureDomainPermission');
        const response = await decryptViewingKey(note.viewingKey, userAccount.address);
        expect(response).toBe(note.realViewingKey);
    });

    it('return empty string if there is no keyStore in storage', async () => {
        const response = await decryptViewingKey(note.viewingKey, userAccount.address);
        expect(response).toBe('');

        const keyStore = await AuthService.getKeyStore();
        expect(keyStore).toBe(null);
    });

    it('return empty string if account has logged out', async () => {
        await storyOf('ensureDomainPermission');
        await AuthService.logout();

        const response = await decryptViewingKey(note.viewingKey, userAccount.address);
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

        const response = await decryptViewingKey(note.viewingKey, userAccount.address);
        expect(response).toBe('');

        getPwDeriveKeySpy.mockRestore();
    });
});
