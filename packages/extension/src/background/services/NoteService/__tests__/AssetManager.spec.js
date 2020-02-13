import {
    userAccount,
} from '~testHelpers/testUsers';
import * as storage from '~/utils/storage';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import {
    PriorityQueue,
} from '~/utils/dataStructures';
import saveToStorage from '../utils/saveToStorage';
import AssetManager from '../helpers/AssetManager';
import Asset from '../helpers/Asset';
import {
    priority,
    assetSummary,
    assetNotes,
} from './testData';

jest.mock('~/utils/storage');

const version = randomInt();
const networkId = randomInt();
const owner = userAccount;
let assetManager;

beforeEach(() => {
    storage.reset();

    assetManager = new AssetManager({
        version,
        networkId,
        owner,
    });
});

const generateMockAssets = (assetIds) => {
    const assets = {};
    assetIds.forEach((assetId) => {
        assets[assetId] = new Asset({
            networkId,
            owner,
            assetId,
        });
        jest.spyOn(assets[assetId], 'startSync').mockImplementation(jest.fn());
    });
    return assets;
};

const orderedActiveAssetIds = () => assetManager
    .activeAssets
    .export()
    .map(asset => asset.id);

const orderedPendingActiveAssetIds = () => assetManager
    .pendingAssets
    .export()
    .map(asset => asset.id);

describe('AssetManager.init', () => {
    let syncNextSpy;
    let rawNoteStartSyncSpy;

    beforeEach(() => {
        syncNextSpy = jest.spyOn(assetManager, 'syncNext')
            .mockImplementation(jest.fn());
        rawNoteStartSyncSpy = jest.spyOn(assetManager.rawNoteManager, 'startSync')
            .mockImplementation(jest.fn());
    });

    it('init Assets from previous summary data saved in storage', async () => {
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

        await assetManager.init();

        const expectedAssetMapping = {};
        const expectedBalances = [];
        Object.keys(assetSummary).forEach((assetId) => {
            expectedAssetMapping[assetId] = expect.any(Asset);
            expectedBalances.push(assetSummary[assetId].balance);
        });

        expect(assetManager.assetMapping).toMatchObject(expectedAssetMapping);
        expect(assetManager.priority).toEqual(priority);

        const balances = await Promise.all(Object.keys(assetManager.assetMapping)
            .map(async (assetId) => {
                const {
                    balance,
                } = await assetManager.get(assetId);
                return balance;
            }));
        expect(balances).toEqual(expectedBalances);

        const lastSyncedBlockNumbers = Object.values(assetSummary)
            .map(({
                lastSynced,
            }) => lastSynced);
        const maxLastSynced = Math.max(...lastSyncedBlockNumbers);

        expect(syncNextSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteStartSyncSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteStartSyncSpy).toHaveBeenCalledWith(maxLastSynced);
    });

    it('will not override priority if it has been set', async () => {
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

        const customPriority = [randomId()];
        assetManager.priority = customPriority;

        await assetManager.init();

        expect(assetManager.priority).toBe(customPriority);
        expect(syncNextSpy).toHaveBeenCalledTimes(1);
    });

    it('will not have initialized any assets if there are no notes in storage and indexedDB', async () => {
        await assetManager.init();
        expect(assetManager.assetMapping).toEqual({});
        expect(assetManager.activeAssets.size).toBe(0);
        expect(assetManager.pendingAssets.size).toBe(0);
        expect(rawNoteStartSyncSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteStartSyncSpy).toHaveBeenCalledWith(-1);
        expect(syncNextSpy).toHaveBeenCalledTimes(1);
    });
});

describe('AssetManager.isSynced', () => {
    it('asset is synced when it is marked as synced and its data are still in noteBucketCache', () => {
        assetManager.assetMapping.a0 = { synced: true };
        assetManager.noteBucketCache.set('a0', {});
        expect(assetManager.isSynced('a0')).toBe(true);
    });

    it('asset is not synced if it is not marked as synced', () => {
        assetManager.assetMapping.a0 = { synced: false };
        assetManager.noteBucketCache.set('a0', {});
        expect(assetManager.isSynced('a0')).toBe(false);
    });

    it('asset is not synced if its data are not in noteBucketCache', () => {
        assetManager.assetMapping.a0 = { synced: true };
        expect(assetManager.isSynced('a0')).toBe(false);
    });
});

describe('AssetManager.ensureSynced', () => {
    let waitInQueueSpy;
    let mockIsSynced;

    beforeEach(() => {
        waitInQueueSpy = jest.spyOn(assetManager, 'waitInQueue')
            .mockImplementation(() => jest.fn());
        mockIsSynced = jest.spyOn(assetManager, 'isSynced')
            .mockImplementation(() => false);
    });

    it('be added to queue if not synced', async () => {
        const cb = jest.fn();
        await assetManager.ensureSynced('a0', cb);
        expect(waitInQueueSpy).toHaveBeenCalledTimes(1);
        expect(waitInQueueSpy).toHaveBeenCalledWith('a0', cb);
        expect(cb).toHaveBeenCalledTimes(0);
    });

    it('trigger callback if synced', async () => {
        mockIsSynced.mockImplementationOnce(() => true);
        const cb = jest.fn();
        await assetManager.ensureSynced('a0', cb);
        expect(waitInQueueSpy).toHaveBeenCalledTimes(0);
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith({
            balance: 0,
            noteValues: {},
            getSortedValues: expect.any(Function),
        });
    });
});

describe('AssetManager .waitInQueue and .flushQueue', () => {
    it('add callback to queue of given asset and return a promise', () => {
        expect(assetManager.callbackCache.cache).toEqual({});

        const queuePromise = assetManager.waitInQueue('a0', jest.fn());
        assetManager.waitInQueue('a1', jest.fn());
        assetManager.waitInQueue('a1', jest.fn());

        expect(queuePromise).toBeInstanceOf(Promise);
        expect(assetManager.callbackCache.cache).toEqual({
            a0: [expect.any(Function)],
            a1: [expect.any(Function), expect.any(Function)],
        });
    });

    it('trigger all the callbacks for a given asset', async () => {
        const cb0 = jest.fn();
        assetManager.waitInQueue('a0', cb0);
        const cb1 = jest.fn();
        assetManager.waitInQueue('a1', cb1);
        const cb2 = jest.fn();
        assetManager.waitInQueue('a0', cb2);

        await assetManager.flushQueue('a0');

        expect(cb0).toHaveBeenCalledTimes(1);
        expect(cb1).toHaveBeenCalledTimes(0);
        expect(cb2).toHaveBeenCalledTimes(1);
    });
});

describe('AssetManager.syncNext', () => {
    beforeEach(() => {
        assetManager.locked = false;
    });

    it('activate assets in the order of priority', () => {
        assetManager.maxActiveAssets = 2;
        assetManager.priority = ['a1', 'a2', 'a0'];
        const assets = generateMockAssets(['a0', 'a1', 'a2']);
        assetManager.assetMapping = assets;
        expect(assetManager.activeAssets.size).toBe(0);
        expect(assetManager.pendingAssets.size).toBe(0);

        assetManager.syncNext();

        expect(assets.a0.startSync).toHaveBeenCalledTimes(0);
        expect(assets.a1.startSync).toHaveBeenCalledTimes(1);
        expect(assets.a2.startSync).toHaveBeenCalledTimes(1);
        expect(assetManager.pendingAssets.size).toBe(0);
        expect(assetManager.activeAssets.size).toBe(2);
        expect(orderedActiveAssetIds()).toEqual(['a1', 'a2']);
    });

    it('skip synced assets', () => {
        assetManager.maxActiveAssets = 2;
        assetManager.priority = ['a1', 'a0', 'a2'];
        const assets = generateMockAssets(['a0', 'a1', 'a2']);
        assetManager.assetMapping = assets;
        assets.a2.synced = true;

        assetManager.syncNext();

        expect(assets.a0.startSync).toHaveBeenCalledTimes(1);
        expect(assets.a1.startSync).toHaveBeenCalledTimes(1);
        expect(assets.a2.startSync).toHaveBeenCalledTimes(0);
        expect(assetManager.pendingAssets.size).toBe(0);
        expect(assetManager.activeAssets.size).toBe(2);
        expect(orderedActiveAssetIds()).toEqual(['a1', 'a0']);
    });

    it('iterate through assets in summary if all assets in priority are synced', () => {
        assetManager.maxActiveAssets = 2;
        assetManager.priority = ['a1', 'a3'];
        const assets = generateMockAssets(['a0', 'a1', 'a2', 'a3']);
        assetManager.assetMapping = assets;
        expect(assetManager.activeAssets.size).toBe(0);
        expect(assetManager.pendingAssets.size).toBe(0);
        assets.a1.synced = true;
        assets.a3.synced = true;

        assetManager.syncNext();

        expect(assets.a0.startSync).toHaveBeenCalledTimes(1);
        expect(assets.a1.startSync).toHaveBeenCalledTimes(0);
        expect(assets.a2.startSync).toHaveBeenCalledTimes(1);
        expect(assets.a3.startSync).toHaveBeenCalledTimes(0);
        expect(assetManager.pendingAssets.size).toBe(0);
        expect(assetManager.activeAssets.size).toBe(2);
        expect(orderedActiveAssetIds()).toEqual(['a0', 'a2']);
    });

    it('bind handleAssetSynced to each asset in it and unbind when the asset is synced', async () => {
        const assets = generateMockAssets(['a0']);
        assetManager.maxActiveAssets = 1;
        assetManager.assetMapping = assets;
        const handleAssetSyncedSpy = jest.spyOn(assetManager, 'handleAssetSynced');
        const saveSpy = jest.spyOn(assets.a0, 'save').mockImplementation(jest.fn());

        assetManager.syncNext();

        expect(handleAssetSyncedSpy).toHaveBeenCalledTimes(0);
        expect(saveSpy).toHaveBeenCalledTimes(0);
        expect(assetManager.activeAssets.size).toBe(1);

        assets.a0.modified = true;
        assets.a0.synced = true;
        await assets.a0.eventListeners.notify('synced', 'a0');
        expect(handleAssetSyncedSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(assetManager.activeAssets.size).toBe(0);
        handleAssetSyncedSpy.mockReset();

        await assets.a0.eventListeners.notify('synced', 'a0');
        expect(handleAssetSyncedSpy).toHaveBeenCalledTimes(0);
    });
});

describe('AssetManager.handleNewRawNotes', () => {
    let syncNextSpy;

    beforeEach(() => {
        syncNextSpy = jest.spyOn(assetManager, 'syncNext')
            .mockImplementation(jest.fn());
    });

    it('trigger syncNext if receive a new asset', () => {
        expect(syncNextSpy).toHaveBeenCalledTimes(0);

        const newAssetId = randomId();
        assetManager.handleNewRawNotes(newAssetId);
        const asset = assetManager.assetMapping[newAssetId];
        expect(assetManager.activeAssets.size).toBe(0);
        expect(assetManager.pendingAssets.size).toBe(1);
        expect(assetManager.pendingAssets.has(asset)).toBe(true);

        expect(syncNextSpy).toHaveBeenCalledTimes(1);
    });

    it('will not trigger syncNext if the asset is in pending queue', () => {
        const assets = generateMockAssets(['a0', 'a1']);
        assetManager.assetMapping = assets;
        assetManager.pendingAssets.addToBottom(assets.a0);
        assetManager.pendingAssets.addToBottom(assets.a1);
        expect(assetManager.pendingAssets.size).toBe(2);

        assetManager.handleNewRawNotes('a0');
        assetManager.handleNewRawNotes('a1');
        expect(syncNextSpy).toHaveBeenCalledTimes(0);
        expect(assetManager.pendingAssets.size).toBe(2);
    });

    it('will add asset to pending queue if it is in active queue', () => {
        const assets = generateMockAssets(['a0', 'a1']);
        assetManager.assetMapping = assets;
        assetManager.activeAssets.addToBottom(assets.a0);
        assetManager.pendingAssets.addToBottom(assets.a1);
        expect(assetManager.pendingAssets.size).toBe(1);

        assetManager.handleNewRawNotes('a0');
        assetManager.handleNewRawNotes('a1');
        expect(syncNextSpy).toHaveBeenCalledTimes(1);
        expect(assetManager.pendingAssets.size).toBe(2);
    });
});

describe('AssetManager.handleCallbackPriorityChanged', () => {
    it('update the priority and add the assets to pending assets', () => {
        const syncNextSpy = jest.spyOn(assetManager, 'syncNext')
            .mockImplementation(jest.fn());

        const newPriority = new PriorityQueue(['a0', 'a1']);
        assetManager.handleCallbackPriorityChanged(newPriority);

        expect(assetManager.priority).toEqual(['a0', 'a1']);
        expect(assetManager.activeAssets.size).toBe(0);
        expect(orderedPendingActiveAssetIds()).toEqual(['a0', 'a1']);
        expect(syncNextSpy).toHaveBeenCalledTimes(1);
    });

    it('remove asset from active assets and prepend them to pending assets if it is not in the new priority anymore', () => {
        const syncNextSpy = jest.spyOn(assetManager, 'syncNext')
            .mockImplementation(jest.fn());
        const oldPriority = ['a0', 'a1'];
        const assets = generateMockAssets(oldPriority);

        assetManager.maxActiveAssets = 2;
        assetManager.priority = oldPriority;
        assetManager.assetMapping = assets;
        oldPriority.forEach((assetId) => {
            assetManager.activeAssets.addToBottom(assets[assetId]);
        });

        expect(orderedActiveAssetIds()).toEqual(['a0', 'a1']);
        expect(syncNextSpy).toHaveBeenCalledTimes(0);

        const newPriority = ['a2', 'a1'];
        assetManager.handleCallbackPriorityChanged(new PriorityQueue(newPriority));

        expect(assetManager.priority).toEqual(['a2', 'a1']);
        expect(orderedActiveAssetIds()).toEqual(['a1']);
        expect(orderedPendingActiveAssetIds()).toEqual(['a2', 'a0']);
        expect(syncNextSpy).toHaveBeenCalledTimes(1);
    });
});
