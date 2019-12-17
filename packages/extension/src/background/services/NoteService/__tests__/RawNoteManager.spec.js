import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    randomId,
    randomInt,
} from '~/utils/random';
import RawNoteManager from '../helpers/RawNoteManager';

const mockFetchNotesFromIndexedDB = jest.fn().mockImplementation(() => []);

jest.mock(
    '../utils/fetchNotesFromIndexedDB',
    () => jest.fn().mockImplementation((...args) => mockFetchNotesFromIndexedDB(...args)),
);

jest.useFakeTimers();

const networkId = randomId();
const owner = userAccount;
const defaultAssetId = randomId();
let rawNoteManager;

const generateNewNotes = (blockNumbers, assetId = defaultAssetId) => blockNumbers
    .map(blockNumber => ({
        asset: assetId,
        blockNumber,
    }));

beforeEach(() => {
    setTimeout.mockClear();
    clearTimeout.mockClear();
    mockFetchNotesFromIndexedDB.mockClear();

    rawNoteManager = new RawNoteManager({
        networkId,
        owner,
    });
});

describe('RawNoteManager.startSync', () => {
    let startSyncIntervalSpy;

    beforeEach(() => {
        startSyncIntervalSpy = jest.spyOn(rawNoteManager, 'startSyncInterval')
            .mockImplementation(jest.fn());
    });

    it('start to fetch notes from indexedDB by calling startSync', async () => {
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(0);

        rawNoteManager.startSync();

        expect(setTimeout).toHaveBeenCalledTimes(1);

        await jest.runOnlyPendingTimers();

        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('can set headBlockNumber boundary while calling startSync', async () => {
        const minHeadBlockNumber = randomInt(10);
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.minHeadBlockNumber).toBe(-1);

        rawNoteManager.startSync(minHeadBlockNumber);
        await jest.runOnlyPendingTimers();

        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteManager.minHeadBlockNumber).toBe(minHeadBlockNumber);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(minHeadBlockNumber);
    });

    it('will not do anything if there is already a sync request running', async () => {
        expect(rawNoteManager.syncFromIndexedDBReq).toBe(null);

        rawNoteManager.startSync();
        await jest.runOnlyPendingTimers();

        const req = rawNoteManager.syncFromIndexedDBReq;
        expect(req).not.toBe(null);
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(1);

        rawNoteManager.startSync();
        await jest.runOnlyPendingTimers();

        expect(rawNoteManager.syncFromIndexedDBReq).toBe(req);
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('will not do anything if head notes are no longer needed', async () => {
        rawNoteManager.maxHeadBlockNumber = 10;
        rawNoteManager.minTailBlockNumber = 11;

        rawNoteManager.startSync();
        await jest.runOnlyPendingTimers();

        expect(rawNoteManager.syncFromIndexedDBReq).toBe(null);
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(0);
    });
});

describe('RawNoteManager.setAssetLastSynced', () => {
    let startSyncAssetIntervalSpy;

    beforeEach(() => {
        startSyncAssetIntervalSpy = jest.spyOn(rawNoteManager, 'startSyncAssetInterval')
            .mockImplementation(jest.fn());
    });

    afterEach(async () => {
        await jest.clearAllTimers();
    });

    it('set lastSynced for asset and trigger startSyncAssetInterval', async () => {
        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(rawNoteManager.syncAssetReqMapping[defaultAssetId]).toBe(undefined);
        expect(setTimeout).toHaveBeenCalledTimes(0);

        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.setAssetLastSynced(defaultAssetId, 0);

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(0);
        expect(rawNoteManager.syncAssetReqMapping[defaultAssetId] > 0).toBe(true);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(startSyncAssetIntervalSpy).toHaveBeenCalledTimes(0);

        await jest.runOnlyPendingTimers();

        expect(startSyncAssetIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('will not do anything if prepend notes are not needed', async () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.setAssetLastSynced(defaultAssetId, 9);

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(setTimeout).toHaveBeenCalledTimes(0);
    });

    it('will not do anything if lastSynced has been set', async () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.setAssetLastSynced(defaultAssetId, 5);
        expect(setTimeout).toHaveBeenCalledTimes(1);

        rawNoteManager.setAssetLastSynced(defaultAssetId, 5);
        expect(setTimeout).toHaveBeenCalledTimes(1);

        rawNoteManager.setAssetLastSynced(defaultAssetId, 2);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});

describe('RawNoteManager.startSyncInterval', () => {
    let fetchHeadNotesSpy;

    beforeEach(() => {
        fetchHeadNotesSpy = jest.spyOn(rawNoteManager, 'fetchHeadNotes')
            .mockImplementation(() => []);
    });

    afterEach(async () => {
        await jest.clearAllTimers();
    });

    it('sync notes from indexedDB every interval if there is no notes', async () => {
        expect(setTimeout).toHaveBeenCalledTimes(0);

        await rawNoteManager.startSyncInterval();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            rawNoteManager.syncInterval,
        );

        await jest.runOnlyPendingTimers();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    it('keep syncing without delay if there are more notes', async () => {
        rawNoteManager.notesPerSyncBatch = 3;
        fetchHeadNotesSpy.mockImplementationOnce(() => generateNewNotes([0, 1, 2]));
        expect(setTimeout).toHaveBeenCalledTimes(0);

        await rawNoteManager.startSyncInterval();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            0,
        );

        await jest.runOnlyPendingTimers();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenCalledTimes(2);
    });

    it('keep syncing with delay if new notes is less than expected number', async () => {
        rawNoteManager.notesPerSyncBatch = 3;
        fetchHeadNotesSpy.mockImplementationOnce(() => generateNewNotes([0, 1]));
        expect(setTimeout).toHaveBeenCalledTimes(0);

        await rawNoteManager.startSyncInterval();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            rawNoteManager.syncInterval,
        );

        await jest.runOnlyPendingTimers();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenCalledTimes(2);
    });
});

describe('RawNoteManager.startSyncAssetInterval', () => {
    let fetchAssetNotesSpy;

    beforeEach(() => {
        fetchAssetNotesSpy = jest.spyOn(rawNoteManager, 'fetchAssetNotes')
            .mockImplementation(() => []);
    });

    afterEach(async () => {
        await jest.clearAllTimers();
    });

    it('keep syncing without delay if there are more notes', async () => {
        rawNoteManager.notesPerSyncBatch = 3;
        fetchAssetNotesSpy.mockImplementationOnce(() => generateNewNotes([0, 1, 2]));
        expect(setTimeout).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.syncAssetReqMapping[defaultAssetId]).toBe(undefined);

        await rawNoteManager.startSyncAssetInterval(defaultAssetId);

        expect(fetchAssetNotesSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            0,
        );
        expect(rawNoteManager.syncAssetReqMapping[defaultAssetId] > 0).toBe(true);

        await jest.runOnlyPendingTimers();

        expect(fetchAssetNotesSpy).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('stop syncing if there are no new notes for given asset', async () => {
        rawNoteManager.notesPerSyncBatch = 3;
        fetchAssetNotesSpy.mockImplementationOnce(() => generateNewNotes([0, 1]));
        expect(setTimeout).toHaveBeenCalledTimes(0);

        await rawNoteManager.startSyncAssetInterval(defaultAssetId);

        expect(fetchAssetNotesSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(0);
    });
});

describe('RawNoteManager.requirePrependNotes', () => {
    beforeEach(() => {
        jest.spyOn(rawNoteManager, 'startSyncAssetInterval')
            .mockImplementation(jest.fn());
    });

    it('need prepend notes only if the last synced block of an asset is smaller than minHeadBlockNumber - 1', () => {
        const assetA = randomId();
        const assetB = randomId();
        const assetC = randomId();
        const assetD = randomId();
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.setAssetLastSynced(assetA, 7);
        rawNoteManager.setAssetLastSynced(assetB, 8);
        rawNoteManager.setAssetLastSynced(assetC, 9);
        rawNoteManager.setAssetLastSynced(assetD, 10);

        expect(rawNoteManager.requirePrependNotes(assetA)).toBe(true);
        expect(rawNoteManager.requirePrependNotes(assetB)).toBe(true);
        expect(rawNoteManager.requirePrependNotes(assetC)).toBe(false);
        expect(rawNoteManager.requirePrependNotes(assetD)).toBe(false);
    });

    it('no need for prepend notes if there are no head notes', () => {
        rawNoteManager.minHeadBlockNumber = -1;

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
    });

    it('no need for prepend notes if lastSynced of an asset is not defined', () => {
        rawNoteManager.minHeadBlockNumber = 10;

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
    });
});

describe('RawNoteManager.requireHeadNotes', () => {
    it('need to fetch notes from indexedDB if there are no notes', () => {
        expect(rawNoteManager.requireHeadNotes()).toBe(true);
    });

    it('need to fetch notes from indexedDB if there are no tail notes', () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 30;
        expect(rawNoteManager.requireHeadNotes()).toBe(true);
    });

    it('need to fetch notes from indexedDB if there are still notes before min tail note', () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 30;
        rawNoteManager.minTailBlockNumber = 40;
        expect(rawNoteManager.requireHeadNotes()).toBe(true);

        rawNoteManager.maxHeadBlockNumber = 38;
        expect(rawNoteManager.requireHeadNotes()).toBe(true);
    });

    it('no need to fetch notes from indexedDB if the block number of min tail note is 0', () => {
        rawNoteManager.minTailBlockNumber = 0;
        expect(rawNoteManager.requireHeadNotes()).toBe(false);
    });

    it('no need to fetch notes from indexedDB if all the head notes are synced', () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 39;
        rawNoteManager.minTailBlockNumber = 40;
        expect(rawNoteManager.requireHeadNotes()).toBe(false);
    });
});

describe('RawNoteManager.getCurrentSynced', () => {
    it('return -1 if no notes are synced', () => {
        expect(rawNoteManager.getCurrentSynced(defaultAssetId)).toBe(-1);
    });

    it('return lastSynced for an asset if it still needs prepend notes', () => {
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 20;
        rawNoteManager.minTailBlockNumber = 30;
        rawNoteManager.maxTailBlockNumber = 40;
        rawNoteManager.setAssetLastSynced(defaultAssetId, 8);

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(true);
        expect(rawNoteManager.getCurrentSynced(defaultAssetId)).toBe(8);
    });

    it('return block number of max head note if an asset does not need prepend notes', () => {
        rawNoteManager.setAssetLastSynced(defaultAssetId, 9);
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 20;

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
        expect(rawNoteManager.getCurrentSynced(defaultAssetId)).toBe(20);
    });

    it('return block number of max head note if they are not fully synced yet', () => {
        rawNoteManager.setAssetLastSynced(defaultAssetId, 9);
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 20;
        rawNoteManager.minTailBlockNumber = 30;
        rawNoteManager.maxTailBlockNumber = 40;

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
        expect(rawNoteManager.requireHeadNotes()).toBe(true);
        expect(rawNoteManager.getCurrentSynced(defaultAssetId)).toBe(20);
    });

    it('return block number of max tail note if both prepend and head notes are synced', () => {
        rawNoteManager.setAssetLastSynced(defaultAssetId, 9);
        rawNoteManager.minHeadBlockNumber = 10;
        rawNoteManager.maxHeadBlockNumber = 29;
        rawNoteManager.minTailBlockNumber = 30;
        rawNoteManager.maxTailBlockNumber = 40;

        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
        expect(rawNoteManager.requireHeadNotes()).toBe(false);
        expect(rawNoteManager.getCurrentSynced(defaultAssetId)).toBe(40);
    });
});

describe('RawNoteManager.fetchAssetNotes', () => {
    let prependHeadsSpy;
    let flushNextInFetchQueue;
    let flushAssetSpy;

    beforeEach(() => {
        prependHeadsSpy = jest.spyOn(rawNoteManager, 'prependHeads')
            .mockImplementation((assetId, notes) => notes);
        flushNextInFetchQueue = jest.spyOn(rawNoteManager, 'flushNextInFetchQueue')
            .mockImplementation(jest.fn());
        flushAssetSpy = jest.spyOn(rawNoteManager, 'flushAssetInFetchQueue')
            .mockImplementation(jest.fn());
    });

    it('fetch notes from indexedDB and call appendHeads', async () => {
        rawNoteManager.notesPerBatch = 2;
        const notes = generateNewNotes([0, 1]);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(prependHeadsSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchAssetNotes(defaultAssetId);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(prependHeadsSpy).toHaveBeenCalledTimes(1);
        expect(prependHeadsSpy).toHaveBeenCalledWith(defaultAssetId, notes);
    });

    it('flush queues by the number of available batches from new notes', async () => {
        rawNoteManager.notesPerBatch = 2;
        rawNoteManager.notesPerSyncBatch = 5;
        const notes = generateNewNotes([0, 1, 2, 3, 4]);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchAssetNotes(defaultAssetId);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(1);
        expect(flushNextInFetchQueue).toHaveBeenCalledWith(defaultAssetId, 2);
        expect(flushAssetSpy).toHaveBeenCalledTimes(0);
    });

    it('flush all queues for an asset if there are no new notes', async () => {
        expect(flushAssetSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchAssetNotes(defaultAssetId);

        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);
        expect(flushAssetSpy).toHaveBeenCalledTimes(1);
    });

    it('flush all queues for an asset if new prepend notes are less than required number', async () => {
        rawNoteManager.notesPerBatch = 2;
        rawNoteManager.notesPerSyncBatch = 5;
        const notes = generateNewNotes([0, 1, 2, 3]);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(flushAssetSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchAssetNotes(defaultAssetId);

        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);
        expect(flushAssetSpy).toHaveBeenCalledTimes(1);
    });
});

describe('RawNoteManager.fetchHeadNotes', () => {
    let appendHeadsSpy;
    let flushNextInFetchQueue;
    let flushAllSpy;

    beforeEach(() => {
        appendHeadsSpy = jest.spyOn(rawNoteManager, 'appendHeads');
        flushNextInFetchQueue = jest.spyOn(rawNoteManager, 'flushNextInFetchQueue')
            .mockImplementation(jest.fn());
        flushAllSpy = jest.spyOn(rawNoteManager, 'flushAllInFetchQueue')
            .mockImplementation(jest.fn());
    });

    it('fetch notes from indexedDB and call appendHeads', async () => {
        const notes = generateNewNotes([
            0,
            1,
        ]);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(appendHeadsSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(appendHeadsSpy).toHaveBeenCalledTimes(1);
        expect(appendHeadsSpy).toHaveBeenCalledWith(notes);
    });

    it('flush queues by the number of available batches from new notes for each asset', async () => {
        rawNoteManager.notesPerBatch = 3;
        rawNoteManager.notesPerSyncBatch = 8;
        const assetA = randomId();
        const assetB = randomId();
        const assetC = randomId();
        const notes = [
            ...generateNewNotes([0, 1, 2, 3], assetA),
            ...generateNewNotes([4], assetB),
            ...generateNewNotes([5, 6, 7], assetC),
        ];
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(2);
        expect(flushNextInFetchQueue).toHaveBeenNthCalledWith(1, assetA, 1);
        expect(flushNextInFetchQueue).toHaveBeenNthCalledWith(2, assetC, 1);
        expect(flushAllSpy).toHaveBeenCalledTimes(0);
    });

    it('flush all queues for an asset if there are no new notes', async () => {
        expect(flushAllSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchHeadNotes();

        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);
        expect(flushAllSpy).toHaveBeenCalledTimes(1);
    });

    it('flush all queues for an asset if new prepend notes are less than required number', async () => {
        rawNoteManager.notesPerBatch = 2;
        rawNoteManager.notesPerSyncBatch = 6;
        const assetA = randomId();
        const assetB = randomId();
        const notes = [
            ...generateNewNotes([0, 1], assetA),
            ...generateNewNotes([2, 3, 4], assetB),
        ];
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => notes);

        expect(flushAllSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.fetchHeadNotes();

        expect(flushNextInFetchQueue).toHaveBeenCalledTimes(0);
        expect(flushAllSpy).toHaveBeenCalledTimes(1);
    });
});

describe('RawNoteManager.prependHeads', () => {
    it('add notes for specific asset and change its lastSynced', () => {
        const notes = generateNewNotes([0, 1, 2, 3, 4]);
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minHeadBlockNumber = 10;

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        rawNoteManager.prependHeads(defaultAssetId, notes);

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(4);
        expect(rawNoteManager.numberOfNotes).toBe(5);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('set minHeadBlockNumber - 1 for an asset if its number of new notes are less than required notes', () => {
        const notes = generateNewNotes([0, 1, 2]);
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minHeadBlockNumber = 10;

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        const newNotes = rawNoteManager.prependHeads(defaultAssetId, notes);

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(9);
        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual(notes);
        expect(newNotes).toEqual(notes);
    });

    it('set minHeadBlockNumber - 1 for an asset if it has no prepend notes', () => {
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minHeadBlockNumber = 10;

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        const newNotes = rawNoteManager.prependHeads(defaultAssetId, []);

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(9);
        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual(undefined);
        expect(newNotes).toEqual([]);
    });

    it('will not add notes that should be in head notes', () => {
        const notes = generateNewNotes([0, 3, 7, 11, 13]);
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minHeadBlockNumber = 9;

        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(undefined);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        rawNoteManager.prependHeads(defaultAssetId, notes);

        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.assetLastSyncedMapping[defaultAssetId]).toBe(8);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual(notes.slice(0, 3));
    });

    it('return new notes that have been added to head notes', () => {
        rawNoteManager.notesPerSyncBatch = 3;
        rawNoteManager.minHeadBlockNumber = 5;

        const noteBatch0 = generateNewNotes([0, 1, 2]);
        const newNotes0 = rawNoteManager.prependHeads(defaultAssetId, noteBatch0);
        expect(newNotes0).toEqual(noteBatch0);

        const noteBatch1 = generateNewNotes([3, 4, 5]);
        const newNotes1 = rawNoteManager.prependHeads(defaultAssetId, noteBatch1);
        expect(newNotes1).toEqual(noteBatch1.slice(0, 2));

        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual([
            ...noteBatch0,
            ...noteBatch1.slice(0, 2),
        ]);
    });
});

describe('RawNoteManager.appendHeads', () => {
    it('allow to add notes from indexedDB by calling appendHeads', () => {
        const notes = generateNewNotes([0, 1, 2, 3, 4]);

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);

        rawNoteManager.appendHeads(notes);

        expect(rawNoteManager.numberOfNotes).toBe(5);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(4);
        expect(rawNoteManager.headNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('set maxHeadBlockNumber to minTailBlockNumber - 1 if the new notes are less than required notes', () => {
        const notes = generateNewNotes([0, 1, 2]);
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minTailBlockNumber = 10;

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);

        rawNoteManager.appendHeads(notes);

        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(9);
        expect(rawNoteManager.headNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('will not add notes that should be in tail notes', () => {
        const notes = generateNewNotes([0, 3, 7, 11, 13]);
        rawNoteManager.notesPerSyncBatch = 5;
        rawNoteManager.minTailBlockNumber = 9;

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);

        rawNoteManager.appendHeads(notes);

        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(8);
        expect(rawNoteManager.headNotesMapping[defaultAssetId]).toEqual(notes.slice(0, 3));
    });

    it('will not do anything if there is no note', () => {
        rawNoteManager.numberOfNotes = 1;
        rawNoteManager.maxHeadBlockNumber = 10;

        rawNoteManager.appendHeads([]);

        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(10);
    });

    it('will set maxHeadBlockNumber to 1 less than minTailBlockNumber if there should be no more notes', () => {
        rawNoteManager.numberOfNotes = 1;
        rawNoteManager.maxHeadBlockNumber = 10;
        rawNoteManager.minTailBlockNumber = 20;

        rawNoteManager.appendHeads([]);

        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(19);
        expect(rawNoteManager.minTailBlockNumber).toBe(20);
    });

    it('return new notes that have been added to head notes', () => {
        rawNoteManager.notesPerSyncBatch = 3;
        rawNoteManager.minTailBlockNumber = 5;

        const noteBatch0 = generateNewNotes([0, 1, 2]);
        const newNotes0 = rawNoteManager.appendHeads(noteBatch0);
        expect(newNotes0).toEqual(noteBatch0);

        const noteBatch1 = generateNewNotes([3, 4, 5]);
        const newNotes1 = rawNoteManager.appendHeads(noteBatch1);
        expect(newNotes1).toEqual(noteBatch1.slice(0, 2));

        expect(rawNoteManager.headNotesMapping[defaultAssetId]).toEqual([
            ...noteBatch0,
            ...noteBatch1.slice(0, 2),
        ]);
    });
});

describe('RawNoteManager.appendTails', () => {
    it('allow to add notes manually by calling appendTails', () => {
        const notes = generateNewNotes([0, 1, 2, 3, 4]);

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.minTailBlockNumber).toBe(-1);
        expect(rawNoteManager.maxTailBlockNumber).toBe(-1);

        rawNoteManager.appendTails(notes);

        expect(rawNoteManager.numberOfNotes).toBe(5);
        expect(rawNoteManager.minTailBlockNumber).toBe(0);
        expect(rawNoteManager.maxTailBlockNumber).toBe(4);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('will stop syncing from indexedDB if min block number has overlapped with head notes', () => {
        const notes = generateNewNotes([3, 5, 7]);
        rawNoteManager.maxHeadBlockNumber = 4;
        rawNoteManager.syncFromIndexedDBReq = 123;

        expect(clearTimeout).toHaveBeenCalledTimes(0);

        rawNoteManager.appendTails(notes);

        expect(clearTimeout).toHaveBeenCalledTimes(1);
        expect(clearTimeout).toHaveBeenCalledWith(123);
        expect(rawNoteManager.numberOfNotes).toBe(2);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(notes.slice(1));
    });

    it('will stop syncing from indexedDB if min tail note is just right after head notes', () => {
        const notes = generateNewNotes([3, 5, 7]);
        rawNoteManager.maxHeadBlockNumber = 2;
        rawNoteManager.syncFromIndexedDBReq = 123;

        expect(clearTimeout).toHaveBeenCalledTimes(0);

        rawNoteManager.appendTails(notes);

        expect(clearTimeout).toHaveBeenCalledTimes(1);
        expect(clearTimeout).toHaveBeenCalledWith(123);
        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('will not stop syncing from indexedDB if min block number is larger than max head note', () => {
        const notes = generateNewNotes([7, 9]);
        rawNoteManager.maxHeadBlockNumber = 4;
        rawNoteManager.syncFromIndexedDBReq = 123;

        expect(clearTimeout).toHaveBeenCalledTimes(0);

        rawNoteManager.appendTails(notes);

        expect(clearTimeout).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.numberOfNotes).toBe(2);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(notes);
    });

    it('will not do anything if there is no note', () => {
        rawNoteManager.numberOfNotes = 1;
        rawNoteManager.maxTailBlockNumber = 10;

        rawNoteManager.appendTails([]);

        rawNoteManager.numberOfNotes = 1;
        rawNoteManager.maxTailBlockNumber = 10;
    });
});

describe('RawNoteManager.fetchAndRemove', () => {
    let waitInFetchQueueSpy;

    beforeEach(() => {
        waitInFetchQueueSpy = jest.spyOn(rawNoteManager, 'waitInFetchQueue')
            .mockImplementation(jest.fn());
    });

    it('return first n notes and remove them from prepend notes mapping', async () => {
        rawNoteManager.notesPerBatch = 2;
        rawNoteManager.minHeadBlockNumber = 10;
        const prependNotes = generateNewNotes([0, 1, 2]);
        rawNoteManager.prependHeads(defaultAssetId, prependNotes);
        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId]).toEqual(prependNotes);

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(notes).toEqual(prependNotes.slice(0, 2));
        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId])
            .toEqual(prependNotes.slice(2));
    });

    it('wait in queue for more notes to be synced if more prepend notes are still required', async () => {
        rawNoteManager.notesPerBatch = 3;
        rawNoteManager.minHeadBlockNumber = 10;
        const noteBatch0 = generateNewNotes([0, 1]);
        rawNoteManager.prependHeads(defaultAssetId, noteBatch0);

        const noteBatch1 = generateNewNotes([2, 3]);
        waitInFetchQueueSpy.mockImplementationOnce(() => {
            rawNoteManager.prependHeads(defaultAssetId, noteBatch1);
        });

        jest.spyOn(rawNoteManager, 'requirePrependNotes')
            .mockImplementationOnce(() => true);

        expect(rawNoteManager.numberOfNotes).toBe(2);
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId])
            .toEqual(noteBatch0);

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(1);
        expect(notes).toEqual([
            ...noteBatch0,
            noteBatch1[0],
        ]);
        expect(rawNoteManager.prependNotesMapping[defaultAssetId])
            .toEqual(noteBatch1.slice(1));
    });

    it('return first n notes and remove them from head notes mapping', async () => {
        rawNoteManager.notesPerBatch = 2;
        const headNotes = generateNewNotes([0, 1, 2]);
        rawNoteManager.appendHeads(headNotes);
        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.headNotesMapping[defaultAssetId]).toEqual(headNotes);

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(notes).toEqual(headNotes.slice(0, 2));
        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(rawNoteManager.headNotesMapping[defaultAssetId])
            .toEqual(headNotes.slice(2));
    });

    it('wait in queue for more notes to be synced if head notes are still syncing', async () => {
        rawNoteManager.notesPerBatch = 3;
        const noteBatch0 = generateNewNotes([0, 1]);
        rawNoteManager.appendHeads(noteBatch0);

        expect(rawNoteManager.numberOfNotes).toBe(2);
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);

        const noteBatch1 = generateNewNotes([2, 3]);
        waitInFetchQueueSpy.mockImplementationOnce(() => {
            rawNoteManager.appendHeads(noteBatch1);
        });

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(1);
        expect(notes).toEqual([
            ...noteBatch0,
            noteBatch1[0],
        ]);
    });

    it('use tail notes if there are no notes in prepend and head notes', async () => {
        rawNoteManager.notesPerBatch = 2;
        const tailNotes = generateNewNotes([0, 1, 2]);
        rawNoteManager.appendTails(tailNotes);
        rawNoteManager.headNotesMapping[defaultAssetId] = [];

        expect(rawNoteManager.numberOfNotes).toBe(3);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(tailNotes);
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.requirePrependNotes(defaultAssetId)).toBe(false);
        expect(rawNoteManager.requireHeadNotes()).toBe(false);

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);
        expect(notes).toEqual(tailNotes.slice(0, 2));
        expect(rawNoteManager.numberOfNotes).toBe(1);
        expect(rawNoteManager.tailNotesMapping[defaultAssetId]).toEqual(tailNotes.slice(2));
    });

    it('return notes from a mapping even when the number is not enough', async () => {
        rawNoteManager.notesPerBatch = 3;
        const headNotes = generateNewNotes([0, 1]);
        rawNoteManager.appendHeads(headNotes);

        expect(rawNoteManager.numberOfNotes).toBe(2);
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);

        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(notes).toEqual(headNotes);
    });

    it('wait in queue if there is already a fetch request in queue', async () => {
        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(0);

        rawNoteManager.fetchQueues[defaultAssetId] = [jest.fn()];
        const notes = await rawNoteManager.fetchAndRemove(defaultAssetId);

        expect(waitInFetchQueueSpy).toHaveBeenCalledTimes(2);
        expect(notes).toEqual([]);
    });
});

describe('RawNoteManager fetch queues', () => {
    it('add resolve to queue by calling waitInFetchQueue and run it through flush', async () => {
        expect(rawNoteManager.fetchQueues).toEqual({});

        [1, 2, 3].forEach(assetId => rawNoteManager.waitInFetchQueue(assetId));

        expect(rawNoteManager.fetchQueues).toEqual({
            1: [expect.any(Function)],
            2: [expect.any(Function)],
            3: [expect.any(Function)],
        });

        rawNoteManager.flushNextInFetchQueue(2);

        expect(rawNoteManager.fetchQueues).toEqual({
            1: [expect.any(Function)],
            2: [],
            3: [expect.any(Function)],
        });
    });

    it('can flush multiple actions at a time', async () => {
        rawNoteManager.waitInFetchQueue(defaultAssetId);
        rawNoteManager.waitInFetchQueue(defaultAssetId);
        rawNoteManager.waitInFetchQueue(defaultAssetId);

        const lastResolve = rawNoteManager.fetchQueues[defaultAssetId][2];
        expect(rawNoteManager.fetchQueues).toEqual({
            [defaultAssetId]: [
                expect.any(Function),
                expect.any(Function),
                expect.any(Function),
            ],
        });
        expect(rawNoteManager.fetchQueues[defaultAssetId][0]).not.toBe(lastResolve);

        rawNoteManager.flushNextInFetchQueue(defaultAssetId, 2);

        expect(rawNoteManager.fetchQueues).toEqual({
            [defaultAssetId]: [expect.any(Function)],
        });
        expect(rawNoteManager.fetchQueues[defaultAssetId][0]).toBe(lastResolve);
    });

    it('can flush all actions for a given asset', () => {
        const assetA = randomId();
        rawNoteManager.waitInFetchQueue(defaultAssetId);
        rawNoteManager.waitInFetchQueue(assetA);
        rawNoteManager.waitInFetchQueue(defaultAssetId);

        expect(rawNoteManager.fetchQueues).toEqual({
            [assetA]: [
                expect.any(Function),
            ],
            [defaultAssetId]: [
                expect.any(Function),
                expect.any(Function),
            ],
        });

        rawNoteManager.flushAssetInFetchQueue(defaultAssetId);

        expect(rawNoteManager.fetchQueues).toEqual({
            [assetA]: [
                expect.any(Function),
            ],
            [defaultAssetId]: [],
        });

        const unkwownAsset = randomId();
        rawNoteManager.flushAssetInFetchQueue(unkwownAsset);

        expect(rawNoteManager.fetchQueues).toEqual({
            [assetA]: [
                expect.any(Function),
            ],
            [defaultAssetId]: [],
        });
    });

    it('can flush all actions for all asset', () => {
        const assetA = randomId();
        rawNoteManager.waitInFetchQueue(defaultAssetId);
        rawNoteManager.waitInFetchQueue(assetA);
        rawNoteManager.waitInFetchQueue(defaultAssetId);

        expect(rawNoteManager.fetchQueues).toEqual({
            [assetA]: [
                expect.any(Function),
            ],
            [defaultAssetId]: [
                expect.any(Function),
                expect.any(Function),
            ],
        });

        rawNoteManager.flushAllInFetchQueue();

        expect(rawNoteManager.fetchQueues).toEqual({});
    });
});
