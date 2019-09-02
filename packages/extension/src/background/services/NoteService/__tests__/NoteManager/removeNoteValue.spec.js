import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

jest.spyOn(ClientSubscriptionService, 'onChange')
    .mockImplementation(() => jest.fn());

const {
    address: ownerAddress,
    linkedPrivateKey,
    linkedPublicKey,
} = userAccount;

let manager;

beforeEach(async () => {
    storage.reset();

    manager = new NoteManager();
    await manager.init(
        ownerAddress,
        linkedPrivateKey,
        linkedPublicKey,
    );
    manager.assetNoteDataMapping = {
        assetId_0: {
            balance: 8,
            noteValues: {
                0: ['n:0', 'n:4'],
                2: ['n:1', 'n:2'],
                4: ['n:3'],
            },
            lastSynced: 'n:4',
        },
    };
});

describe('NoteManager.removeNoteValue', () => {
    it('remove note key and subtract balance from exisintg assetNoteDataMapping', () => {
        manager.removeNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:0',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 8,
                noteValues: {
                    0: ['n:4'],
                    2: ['n:1', 'n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });

        manager.removeNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 2,
            noteKey: 'n:1',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 6,
                noteValues: {
                    0: ['n:4'],
                    2: ['n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });
    });

    it('will not change lastSynced even if that note key is removed', () => {
        manager.removeNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:4',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 8,
                noteValues: {
                    0: ['n:0'],
                    2: ['n:1', 'n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });
    });

    it('will not modify data if value is not in noteValues', () => {
        manager.removeNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 1,
            noteKey: 'n:5',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 8,
                noteValues: {
                    0: ['n:0', 'n:4'],
                    2: ['n:1', 'n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });
    });

    it('will not modify data if note key does not exist in bucket', () => {
        manager.removeNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:5',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 8,
                noteValues: {
                    0: ['n:0', 'n:4'],
                    2: ['n:1', 'n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });
    });

    it('will not modify data if input address is not the same as current owner', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn')
            .mockImplementation(() => jest.fn());

        manager.removeNoteValue({
            ownerAddress: userAccount2.address,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:2',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 8,
                noteValues: {
                    0: ['n:0', 'n:4'],
                    2: ['n:1', 'n:2'],
                    4: ['n:3'],
                },
                lastSynced: 'n:4',
            },
        });

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

        consoleWarnSpy.mockRestore();
    });
});
