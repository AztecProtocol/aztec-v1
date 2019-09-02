import {
    userAccount,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import addressModel from '~database/models/address';
import assetModel from '~database/models/asset';
import noteModel from '~database/models/note';
import mergeWithLatestAsset from '../utils/mergeWithLatestAsset';
import syncAssetNoteData from '../utils/syncAssetNoteData';

jest.mock('~utils/storage');

const mockAssetModelGet = jest.fn();
const assetModelGetSpy = jest.spyOn(assetModel, 'get')
    .mockImplementation((...args) => mockAssetModelGet(...args));

const mockNoteModelLast = jest.fn();
const nodeModelLastSpy = jest.spyOn(noteModel, 'last')
    .mockImplementation((...args) => mockNoteModelLast(...args));

jest.mock('../utils/syncAssetNoteData', () => jest.fn().mockImplementation(() => ({
    balance: 1,
    noteValues: {
        1: ['n:0'],
    },
    lastSynced: 'n:0',
})));

const {
    address: userAddress,
    linkedPrivateKey,
} = userAccount;
let ownerKey;

beforeEach(async () => {
    storage.reset();
    assetModelGetSpy.mockClear();
    mockAssetModelGet.mockClear();
    nodeModelLastSpy.mockClear();
    mockNoteModelLast.mockClear();
    syncAssetNoteData.mockClear();

    ({
        key: ownerKey,
    } = await addressModel.set({
        address: userAddress,
    }));
});

describe('mergeWithLatestAsset', () => {
    it('will merge assetNoteDataMapping with the asset of the latest note', async () => {
        mockNoteModelLast.mockImplementationOnce(() => ({
            asset: 'assetKey0',
        }));
        mockAssetModelGet.mockImplementationOnce(() => ({
            id: 'assetId0',
        }));

        const prevAssetNoteDataMappinig = {};
        const assetNoteDataMapping = await mergeWithLatestAsset(
            userAddress,
            linkedPrivateKey,
            prevAssetNoteDataMappinig,
        );
        expect(assetNoteDataMapping).toEqual({
            assetId0: {
                balance: 1,
                noteValues: {
                    1: ['n:0'],
                },
                lastSynced: 'n:0',
            },
        });
        expect(nodeModelLastSpy).toHaveBeenCalledTimes(1);
        expect(nodeModelLastSpy.mock.calls[0][0]).toEqual({
            owner: ownerKey,
        });
        expect(assetModelGetSpy).toHaveBeenCalledTimes(1);
        expect(assetModelGetSpy.mock.calls[0][0]).toEqual({
            key: 'assetKey0',
        });
        expect(syncAssetNoteData).toHaveBeenCalledTimes(1);
        expect(syncAssetNoteData.mock.calls[0]).toEqual([
            userAddress,
            linkedPrivateKey,
            'assetId0',
        ]);
    });

    it('will merge data to existing asset in prev assetNoteDataMapping', async () => {
        mockNoteModelLast.mockImplementationOnce(() => ({
            asset: 'assetKey0',
        }));
        mockAssetModelGet.mockImplementationOnce(() => ({
            id: 'assetId0',
        }));

        const prevAssetNoteDataMappinig = {
            assetId1: {
                balance: 3,
                noteValues: {
                    1: ['n:1'],
                    2: ['n:2'],
                },
                lastSynced: 'n:2',
            },
        };
        const assetNoteDataMapping = await mergeWithLatestAsset(
            userAddress,
            linkedPrivateKey,
            prevAssetNoteDataMappinig,
        );
        expect(assetNoteDataMapping).toEqual({
            assetId0: {
                balance: 1,
                noteValues: {
                    1: ['n:0'],
                },
                lastSynced: 'n:0',
            },
            assetId1: {
                balance: 3,
                noteValues: {
                    1: ['n:1'],
                    2: ['n:2'],
                },
                lastSynced: 'n:2',
            },
        });
        expect(nodeModelLastSpy).toHaveBeenCalledTimes(1);
        expect(nodeModelLastSpy.mock.calls[0][0]).toEqual({
            owner: ownerKey,
        });
        expect(assetModelGetSpy).toHaveBeenCalledTimes(1);
        expect(assetModelGetSpy.mock.calls[0][0]).toEqual({
            key: 'assetKey0',
        });
        expect(syncAssetNoteData).toHaveBeenCalledTimes(1);
        expect(syncAssetNoteData.mock.calls[0]).toEqual([
            userAddress,
            linkedPrivateKey,
            'assetId0',
        ]);
    });

    it('return previous assetNoteDataMapping if there is no last note in storage', async () => {
        const prevAssetNoteDataMappinig = {};
        const assetNoteDataMapping = await mergeWithLatestAsset(
            userAddress,
            linkedPrivateKey,
            prevAssetNoteDataMappinig,
        );
        expect(assetNoteDataMapping).toBe(prevAssetNoteDataMappinig);
        expect(assetNoteDataMapping).toEqual({});
        expect(nodeModelLastSpy).toHaveBeenCalledTimes(1);
        expect(nodeModelLastSpy.mock.calls[0][0]).toEqual({
            owner: ownerKey,
        });
        expect(assetModelGetSpy).toHaveBeenCalledTimes(0);
        expect(syncAssetNoteData).toHaveBeenCalledTimes(0);
    });

    it('return previous assetNoteDataMapping if the asset of the last note is already in it', async () => {
        mockNoteModelLast.mockImplementationOnce(() => ({
            asset: 'assetKey0',
        }));
        mockAssetModelGet.mockImplementationOnce(() => ({
            id: 'assetId0',
        }));

        const prevAssetNoteDataMappinig = {
            assetId0: {
                balance: 1,
                noteValues: {
                    1: ['n:0'],
                },
                lastSynced: 'n:0',
            },
        };
        const assetNoteDataMapping = await mergeWithLatestAsset(
            userAddress,
            linkedPrivateKey,
            prevAssetNoteDataMappinig,
        );
        expect(assetNoteDataMapping).toEqual(prevAssetNoteDataMappinig);
        expect(nodeModelLastSpy).toHaveBeenCalledTimes(1);
        expect(nodeModelLastSpy.mock.calls[0][0]).toEqual({
            owner: ownerKey,
        });
        expect(assetModelGetSpy).toHaveBeenCalledTimes(1);
        expect(assetModelGetSpy.mock.calls[0][0]).toEqual({
            key: 'assetKey0',
        });
        expect(syncAssetNoteData).toHaveBeenCalledTimes(0);
    });
});
