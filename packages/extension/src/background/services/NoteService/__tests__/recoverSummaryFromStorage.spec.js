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
import recoverSummaryFromStorage from '../utils/recoverSummaryFromStorage';
import {
    assetSummary,
    assetNotes,
    priority,
} from './testData';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('recoverSummaryFromStorage', () => {
    const networkId = randomId();
    const owner = userAccount;
    const assetIds = Object.keys(assetSummary);

    it('recover asset summary and priority from storage', async () => {
        await saveToStorage(
            networkId,
            owner,
            {
                assetSummary,
                assetNotes,
                priority,
            },
        );

        const recovered = await recoverSummaryFromStorage(
            networkId,
            owner,
        );

        expect(recovered).toEqual({
            assetSummary,
            priority,
        });
    });

    it('recover data for the given network', async () => {
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

        const anotherNetwork = randomId();
        const assetSummaryB = {
            newAsset: {
                balance: randomInt(),
                size: randomInt(),
                lastSynced: randomInt(),
            },
            [targetAsset]: {
                balance: randomInt(),
                size: randomInt(),
                lastSynced: randomInt(),
            },
        };
        const priorityB = [targetAsset, 'newAsset'];

        expect(assetSummaryB).not.toEqual(assetSummary);
        expect(priorityB).not.toEqual(priority);

        await saveToStorage(
            anotherNetwork,
            owner,
            {
                assetSummary: assetSummaryB,
                assetNotes,
                priority: priorityB,
            },
        );

        const recoveredA = await recoverSummaryFromStorage(
            networkId,
            owner,
        );
        expect(recoveredA).toEqual({
            assetSummary,
            priority,
        });

        const recoveredB = await recoverSummaryFromStorage(
            anotherNetwork,
            owner,
        );
        expect(recoveredB).toEqual({
            assetSummary: assetSummaryB,
            priority: priorityB,
        });
    });

    it('recover data for the given network', async () => {
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
        const assetSummaryB = {
            newAsset: {
                balance: randomInt(),
                size: randomInt(),
                lastSynced: randomInt(),
            },
            [targetAsset]: {
                balance: randomInt(),
                size: randomInt(),
                lastSynced: randomInt(),
            },
        };
        const priorityB = [targetAsset, 'newAsset'];

        expect(assetSummaryB).not.toEqual(assetSummary);
        expect(priorityB).not.toEqual(priority);

        await saveToStorage(
            networkId,
            anotherOwner,
            {
                assetSummary: assetSummaryB,
                assetNotes,
                priority: priorityB,
            },
        );

        const recoveredA = await recoverSummaryFromStorage(
            networkId,
            owner,
        );
        expect(recoveredA).toEqual({
            assetSummary,
            priority,
        });

        const recoveredB = await recoverSummaryFromStorage(
            networkId,
            anotherOwner,
        );
        expect(recoveredB).toEqual({
            assetSummary: assetSummaryB,
            priority: priorityB,
        });
    });

    it('get empty object and array if there is no data in storage', async () => {
        const recovered = await recoverSummaryFromStorage(
            networkId,
            owner,
        );
        expect(recovered).toEqual({
            assetSummary: {},
            priority: [],
        });
    });
});
