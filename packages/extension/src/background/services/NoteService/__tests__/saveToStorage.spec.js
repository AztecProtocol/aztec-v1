import {
    userAccount,
} from '~helpers/testData';
import * as storage from '~utils/storage';
import dataKey from '~utils/dataKey';
import saveToStorage from '../utils/saveToStorage';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('saveToStorage', () => {
    const {
        address: userAddress,
        linkedPublicKey,
    } = userAccount;

    const hashPattern = /^0x[0-9a-f]+$/i;

    it('save asset note values to storage', async () => {
        const assetNoteDataMapping = {
            assetId0: {
                balance: 12,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2'],
                },
                syncing: true,
                lastSynced: 'n:2',
            },
            assetId1: {
                balance: 7,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                    5: ['n:16'],
                },
                syncing: false,
                lastSynced: 'n:16',
            },
        };
        await saveToStorage(userAddress, linkedPublicKey, assetNoteDataMapping);

        const db = await storage.get();
        expect(db).toEqual({
            [dataKey('userAssets', { user: userAddress })]: {
                assetId0: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:2',
                },
                assetId1: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:16',
                },
            },
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId0' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId1' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
        });
    });

    it('merge new asset to previous storage data', async () => {
        const assetNoteDataMapping = {
            assetId0: {
                balance: 12,
                noteValues: {
                    2: ['n:0'],
                    5: ['n:1', 'n:2'],
                },
                syncing: true,
                lastSynced: 'n:2',
            },
        };
        await saveToStorage(userAddress, linkedPublicKey, assetNoteDataMapping);

        const db = await storage.get();
        expect(db).toEqual({
            [dataKey('userAssets', { user: userAddress })]: {
                assetId0: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:2',
                },
            },
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId0' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
        });

        const newAssetNoteDataMapping = {
            assetId1: {
                balance: 7,
                noteValues: {
                    0: ['n:3', 'n:4'],
                    2: ['n:5'],
                    5: ['n:16'],
                },
                syncing: false,
                lastSynced: 'n:16',
            },
        };
        await saveToStorage(userAddress, linkedPublicKey, newAssetNoteDataMapping);

        const db2 = await storage.get();
        expect(db2).toEqual({
            [dataKey('userAssets', { user: userAddress })]: {
                assetId0: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:2',
                },
                assetId1: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:16',
                },
            },
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId0' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId1' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
        });
    });

    it('override existing asset in storage', async () => {
        const assetNoteDataMapping = {
            assetId0: {
                balance: 7,
                noteValues: {
                    0: ['n:0', 'n:1'],
                    2: ['n:2'],
                    5: ['n:3'],
                },
                syncing: false,
                lastSynced: 'n:3',
            },
        };
        await saveToStorage(userAddress, linkedPublicKey, assetNoteDataMapping);

        const db = await storage.get();
        expect(db).toEqual({
            [dataKey('userAssets', { user: userAddress })]: {
                assetId0: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:3',
                },
            },
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId0' })]: [
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
                expect.stringMatching(hashPattern),
            ],
        });

        const updatedAssetNoteDataMapping = {
            assetId0: {
                balance: 2,
                noteValues: {
                    2: ['n:5'],
                },
                syncing: false,
                lastSynced: 'n:20',
            },
        };
        await saveToStorage(userAddress, linkedPublicKey, updatedAssetNoteDataMapping);

        const db2 = await storage.get();
        expect(db2).toEqual({
            [dataKey('userAssets', { user: userAddress })]: {
                assetId0: {
                    balance: expect.stringMatching(hashPattern),
                    lastSynced: 'n:20',
                },
            },
            [dataKey('userAssetNotes', { user: userAddress, asset: 'assetId0' })]: [
                expect.stringMatching(hashPattern),
            ],
        });
    });
});
