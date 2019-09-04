import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import NoteManager from '../../helpers/NoteManager';
import newAssetNoteData from '../../utils/newAssetNoteData';

jest.mock('~utils/storage');

const {
    address: userAddress,
} = userAccount;

const emptyAssetNoteData = newAssetNoteData();

let manager;

const consoleWarnSpy = jest.spyOn(console, 'warn')
    .mockImplementation(() => jest.fn());

beforeAll(() => {
    manager = new NoteManager();
    manager.owner = {
        address: userAddress,
    };
    manager.assetNoteDataMapping = {
        assetId_0: {
            balance: 12,
            noteValues: {
                0: ['n:0'],
                5: ['n:2'],
                7: ['n:1'],
            },
            lastSynced: 'n:8',
        },
        assetId_1: {
            balance: 2,
            noteValues: {
                0: ['n:3', 'n:4'],
                2: ['n:5'],
            },
            lastSynced: 'n:5',
        },
    };
});

beforeEach(() => {
    storage.reset();
    consoleWarnSpy.mockClear();
});

describe('NoteManager.safeFind', () => {
    it('return reference of the assetNoteData for given assetId', () => {
        const asset0 = manager.safeFind(userAddress)('assetId_0');
        expect(asset0).toBe(manager.assetNoteDataMapping.assetId_0);

        const asset1 = manager.safeFind(userAddress)('assetId_1');
        expect(asset1).toBe(manager.assetNoteDataMapping.assetId_1);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('return empty assetNoteData if asset is not in assetNoteDataMapping', () => {
        const asset = manager.safeFind(userAddress)('assetId2');
        expect(asset).toEqual(emptyAssetNoteData);

        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('will not return asset if input address is not the same as current owner', () => {
        const asset = manager.safeFind(userAccount2.address)('assetId_0');
        expect(asset).not.toBe(manager.assetNoteDataMapping.assetId_0);
        expect(asset).toEqual(emptyAssetNoteData);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
});
