import {
    userAccount,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import NoteManager from '../../helpers/NoteManager';
import recoverFromStorage from '../../utils/recoverFromStorage';

jest.mock('~utils/storage');

const mockRecoverFromStorage = jest.fn();
jest.mock(
    '../../utils/recoverFromStorage',
    () => jest.fn().mockImplementation((...args) => mockRecoverFromStorage(...args)),
);

let manager;

const {
    address: userAddress,
    linkedPrivateKey,
    linkedPublicKey,
} = userAccount;

beforeEach(() => {
    storage.reset();
    recoverFromStorage.mockClear();
    mockRecoverFromStorage.mockClear();

    manager = new NoteManager();
});

describe('NoteManager.init', () => {
    it('recover data and merge notes from storage by running init ', async () => {
        mockRecoverFromStorage.mockImplementation(() => ({
            assetId: {
                balance: 2,
                noteValues: {
                    2: ['n:0'],
                },
                lastSynced: 'n:0',
            },
        }));

        expect(manager.owner).toEqual({
            address: '',
            linkedPrivateKey: '',
            linkedPublicKey: '',
        });
        expect(manager.assetNoteDataMapping).toEqual({});

        await manager.init(userAddress, linkedPrivateKey, linkedPublicKey);

        expect(manager.owner).toEqual({
            address: userAddress,
            linkedPrivateKey,
            linkedPublicKey,
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId: {
                balance: 2,
                noteValues: {
                    2: ['n:0'],
                },
                lastSynced: 'n:0',
            },
        });
        expect(recoverFromStorage).toHaveBeenCalledTimes(1);
    });

    it('will not init twice with the same user', async () => {
        await manager.init(userAddress, linkedPrivateKey, linkedPublicKey);
        expect(recoverFromStorage).toHaveBeenCalledTimes(1);

        await manager.init(userAddress, linkedPrivateKey, linkedPublicKey);
        expect(recoverFromStorage).toHaveBeenCalledTimes(1);
    });
});
