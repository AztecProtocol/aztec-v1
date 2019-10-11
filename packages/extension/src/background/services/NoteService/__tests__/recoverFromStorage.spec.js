import {
    userAccount,
} from '~testHelpers/testUsers';
import * as storage from '~utils/storage';
import saveToStorage from '../utils/saveToStorage';
import recoverFromStorage from '../utils/recoverFromStorage';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('recoverFromStorage', () => {
    const {
        address: userAddress,
        linkedPublicKey,
        linkedPrivateKey,
    } = userAccount;

    const assetNoteDataMapping = {
        assetId0: {
            balance: 12,
            noteValues: {
                2: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        },
        assetId1: {
            balance: 2,
            noteValues: {
                0: ['n:3', 'n:4'],
                2: ['n:5'],
            },
            lastSynced: 'n:5',
        },
    };

    it('recover asset note values data from storage', async () => {
        await saveToStorage(userAddress, linkedPublicKey, assetNoteDataMapping);
        const recovered = await recoverFromStorage(userAddress, linkedPrivateKey);
        expect(recovered).toEqual(assetNoteDataMapping);
    });

    it('get empty object if there is no encrypted data in storage', async () => {
        const recovered = await recoverFromStorage(userAddress, linkedPrivateKey);
        expect(recovered).toEqual({});
    });
});
