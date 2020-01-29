import {
    userAccount,
    userAccount2,
} from '~testHelpers/testUsers';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import * as storage from '~/utils/storage';
import saveToStorage from '../utils/saveToStorage';
import recoverAssetNotesFromStorage from '../utils/recoverAssetNotesFromStorage';
import {
    assetSummary,
    assetNotes,
    priority,
} from './testData';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('recoverAssetNotesFromStorage', () => {
    const networkId = randomInt();
    const owner = userAccount;
    const assetIds = Object.keys(assetSummary);

    it('recover note values from storage for given asset', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const targetAsset = assetIds[randomInt(0, assetIds.length - 1)];

        const recovered = await recoverAssetNotesFromStorage(
            networkId,
            owner,
            targetAsset,
        );

        expect(recovered).toEqual(assetNotes[targetAsset]);
    });

    it('recover assetNotes for the given network', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const targetAsset = assetIds[randomInt(0, assetIds.length - 1)];

        const anotherNetwork = randomInt();
        const assetNotesB = {
            newAsset: {
                2: ['n:0'],
                5: ['n:3', 'n:4'],
            },
            [targetAsset]: {
                0: ['n:3', 'n:4'],
                7: ['n:16'],
            },
        };
        await saveToStorage(
            anotherNetwork,
            owner,
            {
                assetSummary,
                assetNotes: assetNotesB,
                priority: [targetAsset, 'newAsset'],
            },
        );

        expect(anotherNetwork).not.toBe(networkId);
        expect(assetNotesB[targetAsset]).not.toEqual(assetNotes[targetAsset]);

        const recoveredA = await recoverAssetNotesFromStorage(
            networkId,
            owner,
            targetAsset,
        );
        expect(recoveredA).toEqual(assetNotes[targetAsset]);

        const recoveredB = await recoverAssetNotesFromStorage(
            anotherNetwork,
            owner,
            targetAsset,
        );
        expect(recoveredB).toEqual(assetNotesB[targetAsset]);
    });

    it('recover assetNotes for the given owner', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const targetAsset = assetIds[randomInt(0, assetIds.length - 1)];

        const anotherOwner = userAccount2;
        const assetNotesB = {
            newAsset: {
                2: ['n:0'],
                5: ['n:3', 'n:4'],
            },
            [targetAsset]: {
                0: ['n:3', 'n:4'],
                7: ['n:16'],
            },
        };
        await saveToStorage(
            networkId,
            anotherOwner,
            {
                assetSummary,
                assetNotes: assetNotesB,
                priority: [targetAsset, 'newAsset'],
            },
        );

        expect(anotherOwner).not.toEqual(owner);
        expect(assetNotesB[targetAsset]).not.toEqual(assetNotes[targetAsset]);

        const recoveredA = await recoverAssetNotesFromStorage(
            networkId,
            owner,
            targetAsset,
        );
        expect(recoveredA).toEqual(assetNotes[targetAsset]);

        const recoveredB = await recoverAssetNotesFromStorage(
            networkId,
            anotherOwner,
            targetAsset,
        );
        expect(recoveredB).toEqual(assetNotesB[targetAsset]);
    });

    it('return empty object if there is no data for given asset in storage', async () => {
        const randomAsset = randomId();
        const recovered = await recoverAssetNotesFromStorage(
            networkId,
            owner,
            randomAsset,
        );
        expect(recovered).toEqual({});
    });
});
