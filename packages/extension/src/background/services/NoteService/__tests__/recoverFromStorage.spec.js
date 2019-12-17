import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    randomId,
} from '~/utils/random';
import * as storage from '~/utils/storage';
import saveToStorage from '../utils/saveToStorage';
import recoverFromStorage from '../utils/recoverFromStorage';
import {
    assetSummary,
    assetNotes,
    priority,
} from './testData';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('recoverFromStorage', () => {
    const networkId = randomId(10);
    const owner = userAccount;

    const recoveredAssetSummary = {};
    Object.keys(assetSummary).forEach((assetId) => {
        const {
            balance,
            size,
            lastSynced,
        } = assetSummary[assetId];
        recoveredAssetSummary[assetId] = {
            balance,
            size,
            lastSynced,
        };
    });

    it('recover asset note values data from storage', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const recovered = await recoverFromStorage(
            networkId,
            owner,
        );

        expect(recovered).toEqual({
            assetSummary: recoveredAssetSummary,
            priority,
            assetNotes,
        });
    });

    it('only recover assetNotes whose key is in priority', async () => {
        const newPriority = priority.slice(1, 2);
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority: newPriority,
            },
        );

        const recovered = await recoverFromStorage(
            networkId,
            owner,
        );
        const expectedAssetNotes = {};
        newPriority.forEach((assetId) => {
            expectedAssetNotes[assetId] = assetNotes[assetId];
        });
        expect(recovered).toEqual({
            assetSummary: recoveredAssetSummary,
            assetNotes: expectedAssetNotes,
            priority: newPriority,
        });
    });

    it('only recover assetNotes in the same network', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const anotherNetwork = randomId(10);
        const sameAsset = priority[1];
        const assetNotesB = {
            newAsset: {
                2: ['n:0'],
                5: ['n:3', 'n:4'],
            },
            [sameAsset]: {
                0: ['n:3', 'n:4'],
                7: ['n:16'],
            },
        };
        const priorityB = [sameAsset, 'newAsset'];
        await saveToStorage(
            anotherNetwork,
            owner,
            {
                assetSummary,
                assetNotes: assetNotesB,
                priority: priorityB,
            },
        );

        const recoveredA = await recoverFromStorage(
            networkId,
            owner,
        );
        expect(recoveredA).toEqual({
            assetSummary: recoveredAssetSummary,
            priority,
            assetNotes,
        });

        const recoveredB = await recoverFromStorage(
            anotherNetwork,
            owner,
        );
        expect(recoveredB).toEqual({
            assetSummary: recoveredAssetSummary,
            assetNotes: assetNotesB,
            priority: priorityB,
        });
    });

    it('get empty object if there is no encrypted data in storage', async () => {
        const recovered = await recoverFromStorage(
            networkId,
            owner,
        );
        expect(recovered).toEqual({
            assetSummary: {},
            priority: [],
            assetNotes: {},
        });
    });
});
