import {
    userAccount,
    userAccount2,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import syncAssetNoteData from '../../utils/syncAssetNoteData';
import removeDestroyedNotes from '../../utils/removeDestroyedNotes';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

const mockSyncAssetNoteData = jest.fn().mockImplementation(() => ({
    balance: 0,
    noteValues: {},
    lastSynced: '',
}));
jest.mock(
    '../../utils/syncAssetNoteData',
    () => jest.fn().mockImplementation((...args) => mockSyncAssetNoteData(...args)),
);

const mockRemoveDestroyedNotes = jest.fn().mockImplementation(assetNoteData => assetNoteData);
jest.mock(
    '../../utils/removeDestroyedNotes',
    () => jest.fn().mockImplementation((...args) => mockRemoveDestroyedNotes(...args)),
);

let flushQueueSpy;

const {
    address: userAddress,
    linkedPrivateKey,
    linkedPublicKey,
} = userAccount;

let manager;

beforeEach(async () => {
    storage.reset();
    mockSyncAssetNoteData.mockClear();
    syncAssetNoteData.mockClear();
    mockRemoveDestroyedNotes.mockClear();
    removeDestroyedNotes.mockClear();

    manager = new NoteManager();
    await manager.init(
        userAddress,
        linkedPrivateKey,
        linkedPublicKey,
    );

    flushQueueSpy = jest.spyOn(manager, 'flushQueue');
});

describe('NoteManager.syncAsset', () => {
    it('merge data previously recoverd from storage with the new data generated from the notes for the asset', async () => {
        mockSyncAssetNoteData.mockImplementationOnce((addr, privateKey, assetId) => {
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

        manager.assetNoteDataMapping = {
            assetId1: {
                balance: 2,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAddress,
            assetId: 'assetId0',
        });

        expect(manager.assetNoteDataMapping).toEqual({
            assetId0: {
                balance: 12,
                noteValues: {
                    5: ['n:6'],
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
        expect(mockSyncAssetNoteData).toHaveBeenCalledTimes(1);
        expect(flushQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('merge the new asset data with the previous asset data', async () => {
        mockSyncAssetNoteData.mockImplementationOnce(() => ({
            balance: 12,
            noteValues: {
                5: ['n:6'],
                7: ['n:8'],
            },
            lastSynced: 'n:8',
        }));

        manager.assetNoteDataMapping = {
            assetId0: {
                balance: 17,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2', 'n:6'],
                },
                lastSynced: 'n:6',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAddress,
            assetId: 'assetId0',
        });

        expect(manager.assetNoteDataMapping).toEqual({
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
        expect(mockSyncAssetNoteData).toHaveBeenCalledTimes(1);
        expect(mockSyncAssetNoteData.mock.calls[0]).toEqual([
            userAddress,
            linkedPrivateKey,
            'assetId0',
            'n:6',
        ]);
        expect(flushQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('remove existing notes that have been destroyed', async () => {
        mockSyncAssetNoteData.mockImplementationOnce(() => ({
            balance: 12,
            noteValues: {
                5: ['n:6'],
                7: ['n:8'],
            },
            lastSynced: 'n:8',
        }));
        mockRemoveDestroyedNotes.mockImplementationOnce(() => ({
            balance: 12,
            noteValues: {
                2: ['n:0'],
                5: ['n:1', 'n:6'],
            },
            lastSynced: 'n:6',
        }));

        manager.assetNoteDataMapping = {
            assetId0: {
                balance: 17,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2', 'n:6'],
                },
                lastSynced: 'n:6',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAddress,
            assetId: 'assetId0',
        });

        expect(manager.assetNoteDataMapping).toEqual({
            assetId0: {
                balance: 19,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:6'],
                    7: ['n:8'],
                },
                lastSynced: 'n:8',
            },
        });
        expect(mockRemoveDestroyedNotes).toHaveBeenCalledTimes(1);
        expect(flushQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('will not check destroyed notes if removeDestroyed is false', async () => {
        mockSyncAssetNoteData.mockImplementationOnce(() => ({
            balance: 12,
            noteValues: {
                5: ['n:6'],
                7: ['n:8'],
            },
            lastSynced: 'n:8',
        }));

        manager.assetNoteDataMapping = {
            assetId0: {
                balance: 17,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2'],
                },
                lastSynced: 'n:2',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAddress,
            assetId: 'assetId0',
            removeDestroyed: false,
        });

        expect(manager.assetNoteDataMapping).toEqual({
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
        expect(mockRemoveDestroyedNotes).toHaveBeenCalledTimes(0);
        expect(flushQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('will still add a valid object for the asset that has no notes', async () => {
        manager.assetNoteDataMapping = {
            assetId1: {
                balance: 2,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAddress,
            assetId: 'assetId0',
        });

        expect(manager.assetNoteDataMapping).toEqual({
            assetId0: {
                balance: 0,
                noteValues: {},
                lastSynced: '',
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
        expect(mockSyncAssetNoteData).toHaveBeenCalledTimes(1);
        expect(flushQueueSpy).toHaveBeenCalledTimes(1);
    });

    it('will not sync if the address is different from the owner address in manager', async () => {
        const warnSpy = jest.spyOn(console, 'warn')
            .mockImplementation(() => jest.fn());

        manager.assetNoteDataMapping = {
            assetId1: {
                balance: 2,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        };

        await manager.syncAsset({
            ownerAddress: userAccount2.address,
            assetId: 'assetId0',
        });

        expect(manager.assetNoteDataMapping).toEqual({
            assetId1: {
                balance: 2,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                },
                lastSynced: 'n:5',
            },
        });
        expect(mockSyncAssetNoteData).toHaveBeenCalledTimes(0);
        expect(flushQueueSpy).toHaveBeenCalledTimes(0);

        expect(warnSpy).toHaveBeenCalledTimes(1);

        warnSpy.mockRestore();
    });
});
