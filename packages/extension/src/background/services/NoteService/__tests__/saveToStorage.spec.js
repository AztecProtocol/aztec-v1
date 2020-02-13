import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    randomInt,
    randomId,
} from '~/utils/random';
import * as storage from '~/utils/storage';
import dataKey from '~/utils/dataKey';
import saveToStorage from '../utils/saveToStorage';
import {
    assetSummary,
    assetNotes,
    priority,
} from './testData';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('saveToStorage', () => {
    const version = randomInt();
    const networkId = randomId(10);
    const {
        address,
        linkedPublicKey,
    } = userAccount;
    const owner = {
        address,
        linkedPublicKey,
    };

    const userAssetsDataKey = dataKey('userAssets', {
        version,
        user: owner.address,
        network: networkId,
    });
    const assetPriorityDataKey = dataKey('userAssetPriority', {
        version,
        user: owner.address,
        network: networkId,
    });
    const getAssetNotesDataKey = assetId => dataKey('userAssetNotes', {
        version,
        user: owner.address,
        asset: assetId,
        network: networkId,
    });

    const hashPattern = /^0x[0-9a-f]+$/i;

    const storageSummaryData = {};
    Object.keys(assetSummary).forEach((assetId) => {
        const {
            lastSynced,
            size,
        } = assetSummary[assetId];
        storageSummaryData[assetId] = {
            balance: expect.stringMatching(hashPattern),
            size,
            lastSynced,
        };
    });
    const commonStorageData = {
        [userAssetsDataKey]: storageSummaryData,
        [assetPriorityDataKey]: priority,
    };

    it('save asset note values to storage', async () => {
        await saveToStorage(
            version,
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const expectedAssetNotes = {};
        Object.keys(assetNotes).forEach((assetId) => {
            expectedAssetNotes[getAssetNotesDataKey(assetId)] = Object.keys(assetNotes[assetId])
                .map(() => expect.stringMatching(hashPattern));
        });

        const db = await storage.get();
        expect(db).toEqual({
            ...commonStorageData,
            ...expectedAssetNotes,
        });
    });

    it('merge summary with previous summary data in storage', async () => {
        await saveToStorage(
            version,
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const prevStorageSummary = await storage.get(userAssetsDataKey);

        const assetIds = Object.keys(assetSummary);
        const newAssetSummary = {
            [assetIds[0]]: {
                balance: assetSummary[assetIds[0]].balance + 2,
                size: 1,
                lastSynced: 'n:20',
            },
            newAsset: {
                balance: 0,
                size: 10,
                lastSynced: 'n:190',
            },
        };

        await saveToStorage(
            version,
            networkId,
            owner,
            {
                assetSummary: newAssetSummary,
                assetNotes,
                priority,
            },
        );

        const storageSummary = await storage.get(userAssetsDataKey);
        expect(storageSummary).toEqual({
            ...prevStorageSummary,
            [assetIds[0]]: {
                ...newAssetSummary[assetIds[0]],
                balance: expect.stringMatching(hashPattern),
            },
            newAsset: {
                ...newAssetSummary.newAsset,
                balance: expect.stringMatching(hashPattern),
            },
        });

        expect(storageSummary[assetIds[0]].balance)
            .not.toBe(prevStorageSummary[assetIds[0]].balance);
    });

    it('override existing asset in storage', async () => {
        await saveToStorage(
            version,
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const toOverride = priority[0];
        const prevStorageAssetNotes = await storage.get(getAssetNotesDataKey(toOverride));

        const newAssetNotes = {
            [toOverride]: {
                2: ['n:5'],
                12: ['n:5'],
            },
        };
        await saveToStorage(
            version,
            networkId,
            owner,
            {
                assetSummary,
                assetNotes: newAssetNotes,
                priority,
            },
        );
        const storageAssetNotes = await storage.get(getAssetNotesDataKey(toOverride));
        expect(storageAssetNotes).toEqual([
            expect.stringMatching(hashPattern),
            expect.stringMatching(hashPattern),
        ]);
        expect(storageAssetNotes).not.toEqual(prevStorageAssetNotes);
    });
});
