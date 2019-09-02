import {
    userAccount,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import syncAssetNoteData from '../utils/syncAssetNoteData';
import mergeRecoveredWithStorage from '../utils/mergeRecoveredWithStorage';

jest.mock('~utils/storage');

const mockSyncAssetNoteData = jest.fn().mockImplementation(() => ({
    balance: 0,
    noteValues: {},
    lastSynced: '',
}));

jest.mock(
    '../utils/syncAssetNoteData',
    () => jest.fn().mockImplementation((...args) => mockSyncAssetNoteData(...args)),
);

beforeEach(() => {
    storage.reset();
    syncAssetNoteData.mockClear();
    mockSyncAssetNoteData.mockClear();
});

describe('mergeRecoveredWithStorage', () => {
    const {
        address: userAddress,
        linkedPrivateKey,
    } = userAccount;

    it('merge data recoverd from storage with the rest of the notes in storage', async () => {
        mockSyncAssetNoteData.mockImplementation((addr, privateKey, assetId) => {
            if (assetId === 'assetId0') {
                return {
                    balance: 12,
                    noteValues: {
                        5: ['n:6'],
                        7: ['n:8'],
                    },
                    lastSynced: 'n:8',
                };
            }
            return {
                balance: 0,
                noteValues: {},
                lastSynced: '',
            };
        });

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

        const merged = await mergeRecoveredWithStorage(
            userAddress,
            linkedPrivateKey,
            assetNoteDataMapping,
        );

        expect(merged).toEqual({
            assetId0: {
                balance: 24,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2', 'n:6'],
                    7: ['n:8'],
                },
                lastSynced: 'n:8',
            },
            assetId1: {
                balance: 2,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        });
        expect(mockSyncAssetNoteData.mock.calls.length).toBe(2);
    });

    it('will not add the same note value to balance more than once', async () => {
        mockSyncAssetNoteData.mockImplementationOnce(() => ({
            balance: 12,
            noteValues: {
                5: ['n:6'],
                7: ['n:8'],
            },
            lastSynced: 'n:8',
        }));

        const assetNoteDataMapping = {
            assetId0: {
                balance: 17,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2', 'n:6'],
                },
                lastSynced: 'n:2',
            },
        };

        const merged = await mergeRecoveredWithStorage(
            userAddress,
            linkedPrivateKey,
            assetNoteDataMapping,
        );

        expect(merged).toEqual({
            assetId0: {
                balance: 24,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2', 'n:6'],
                    7: ['n:8'],
                },
                lastSynced: 'n:8',
            },
        });
    });

    it('will return empty object if prev assetNoteDataMapping is empty', async () => {
        const merged = await mergeRecoveredWithStorage(
            userAddress,
            linkedPrivateKey,
            {},
        );

        expect(merged).toEqual({});
        expect(mockSyncAssetNoteData.mock.calls.length).toBe(0);
    });
});
