import cloneDeep from 'lodash/cloneDeep';
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
            balance: 5,
            noteValues: {
                0: ['n:0'],
                5: ['n:1'],
            },
            lastSynced: 'n:8',
        },
    };
});

describe('NoteManager.addNoteValue', () => {
    it('add note key and increment balance to exisintg assetNoteDataMapping', () => {
        manager.addNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:2',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 5,
                noteValues: {
                    0: ['n:0', 'n:2'],
                    5: ['n:1'],
                },
                lastSynced: 'n:8',
            },
        });

        manager.addNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 10,
            noteKey: 'n:3',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 15,
                noteValues: {
                    0: ['n:0', 'n:2'],
                    5: ['n:1'],
                    10: ['n:3'],
                },
                lastSynced: 'n:8',
            },
        });
    });

    it('will not change lastSynced even if new note key is greater than previous one', () => {
        manager.addNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:10',
        });
        expect(manager.assetNoteDataMapping).toEqual({
            assetId_0: {
                balance: 5,
                noteValues: {
                    0: ['n:0', 'n:10'],
                    5: ['n:1'],
                },
                lastSynced: 'n:8',
            },
        });
    });

    it('will not modify data if note key is already in noteValues', () => {
        const prevAssetNoteDataMapping = cloneDeep(manager.assetNoteDataMapping);
        manager.addNoteValue({
            ownerAddress,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:0',
        });
        expect(manager.assetNoteDataMapping).toEqual(prevAssetNoteDataMapping);
    });

    it('will not modify data if input address is not the same as current owner', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn')
            .mockImplementation(() => jest.fn());

        const prevAssetNoteDataMapping = cloneDeep(manager.assetNoteDataMapping);
        manager.addNoteValue({
            ownerAddress: userAccount2.address,
            assetId: 'assetId_0',
            value: 0,
            noteKey: 'n:2',
        });
        expect(manager.assetNoteDataMapping).toEqual(prevAssetNoteDataMapping);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

        consoleWarnSpy.mockRestore();
    });
});
