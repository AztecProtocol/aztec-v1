import {
    userAccount,
} from '~testHelpers/testUsers';
import {
    randomId,
    randomInt,
} from '~utils/random';
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
    mockFetchNotesFromIndexedDB.mockClear();

    rawNoteManager = new RawNoteManager({
        networkId,
        owner,
    });
});

describe('RawNoteManager.startSync', () => {
    let fetchHeadNotesSpy;

    beforeEach(() => {
        fetchHeadNotesSpy = jest.spyOn(rawNoteManager, 'fetchHeadNotes')
            .mockImplementation(jest.fn());
    });

    it('start to fetch notes from indexedDB by calling startSync', async () => {
        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(0);

        await rawNoteManager.startSync();

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(1);
    });

    it('can set headBlockNumber boundary while calling startSync', async () => {
        const minHeadBlockNumber = randomInt(10);
        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.minHeadBlockNumber).toBe(-1);

        await rawNoteManager.startSync(minHeadBlockNumber);

        expect(fetchHeadNotesSpy).toHaveBeenCalledTimes(1);
        expect(rawNoteManager.minHeadBlockNumber).toBe(minHeadBlockNumber);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(minHeadBlockNumber);
    });
});

describe('RawNoteManager .fetchHeadNotes and .startSyncInterval', () => {
    let startSyncIntervalSpy;

    beforeEach(() => {
        startSyncIntervalSpy = jest.spyOn(rawNoteManager, 'startSyncInterval');
    });

    it('fetch notes from indexedDB and update the values in manager', async () => {
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => generateNewNotes([
            0,
            1,
        ]));
        startSyncIntervalSpy.mockImplementationOnce(jest.fn());

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(rawNoteManager.numberOfNotes).toBe(2);

        await rawNoteManager.fetchHeadNotes();
        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(2);
        expect(rawNoteManager.numberOfNotes).toBe(2);
    });

    it('start syncing notes from indexedDB every interval if there is no notes', async () => {
        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            rawNoteManager.syncInterval,
        );
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(0);

        await jest.runOnlyPendingTimers();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(2);
        expect(startSyncIntervalSpy).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    it('will not trigger interval sync if it has been initiated', async () => {
        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), rawNoteManager.syncInterval);

        await rawNoteManager.fetchHeadNotes();

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(2);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });
});

describe('RawNoteManager.fetchMoreForAsset', () => {
    it('keep fetching notes until there are enough notes for specific asset', async () => {
        const customAssetId = randomId();
        const firstResponse = [
            ...generateNewNotes([3, 4], defaultAssetId),
            ...generateNewNotes([5, 6], customAssetId),
        ];
        const secondResponse = [
            ...generateNewNotes([7, 8], defaultAssetId),
            ...generateNewNotes([9, 10], customAssetId),
        ];
        const thirdResponse = [
            ...generateNewNotes([11], defaultAssetId),
            ...generateNewNotes([12, 13], customAssetId),
        ];
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => firstResponse);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => secondResponse);
        mockFetchNotesFromIndexedDB.mockImplementationOnce(() => thirdResponse);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(0);
        expect(rawNoteManager.numberOfNotes).toBe(0);

        const targetNumber = 3;
        await rawNoteManager.fetchMoreForAsset(customAssetId, targetNumber);

        expect(mockFetchNotesFromIndexedDB).toHaveBeenCalledTimes(2);
        expect(rawNoteManager.numberOfNotes).toBe(8);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(10);
    });

    it('will fetch from indexedDB for specific asset if its lastSynced is smaller than minHeadBlockNumber', async () => {
        rawNoteManager.minHeadBlockNumber = 5;
        rawNoteManager.maxHeadBlockNumber = 10;
        rawNoteManager.minTailBlockNumber = 11;
        rawNoteManager.setAssetLastSynced(defaultAssetId, 3);
        const fetchAssetNotesSpy = jest.spyOn(rawNoteManager, 'fetchAssetNotes');

        await rawNoteManager.fetchMoreForAsset(defaultAssetId, 1);

        expect(fetchAssetNotesSpy).toHaveBeenCalledTimes(1);
    });
});

describe('RawNoteManager appends new notes', () => {
    it('allow to add notes from indexedDB by calling appendHeads', () => {
        const notes = generateNewNotes([0, 1, 2, 3, 4]);

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);

        rawNoteManager.appendHeads(notes);

        expect(rawNoteManager.numberOfNotes).toBe(5);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(4);
    });

    it('allow to add notes manually by calling appendTails', () => {
        const notes = generateNewNotes([0, 1, 2, 3, 4]);

        expect(rawNoteManager.numberOfNotes).toBe(0);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);
        expect(rawNoteManager.minTailBlockNumber).toBe(-1);

        rawNoteManager.appendTails(notes);

        expect(rawNoteManager.numberOfNotes).toBe(5);
        expect(rawNoteManager.maxHeadBlockNumber).toBe(-1);
        expect(rawNoteManager.minTailBlockNumber).toBe(0);
    });
});
