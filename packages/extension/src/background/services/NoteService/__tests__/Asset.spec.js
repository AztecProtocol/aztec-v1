import {
    userAccount,
} from '~testHelpers/testUsers';
import testNotes from '~testHelpers/testNotes';
import {
    VIEWING_KEY_LENGTH,
} from '~config/constants';
import * as storage from '~utils/storage';
import {
    randomId,
    randomInt,
} from '~utils/random';
import Asset from '../helpers/Asset';
import NoteBucketCache from '../helpers/NoteBucketCache';
import RawNoteManager from '../helpers/RawNoteManager';

jest.mock('~utils/storage');

const assetId = randomId();
const networkId = randomInt();
const owner = userAccount;
let noteBucketCache;
let rawNoteManager;
let asset;

beforeEach(() => {
    storage.reset();

    noteBucketCache = new NoteBucketCache({
        networkId,
        owner,
    });
    rawNoteManager = new RawNoteManager({
        networkId,
        owner,
    });
    asset = new Asset({
        assetId,
        networkId,
        owner,
        noteBucketCache,
        rawNoteManager,
    });
});

describe('Asset.startSync', () => {
    it('restor data and trigger actions to start processing notes', async () => {
        const restoreSpy = jest.spyOn(asset, 'restore');
        const getRawNotesSpy = jest.spyOn(asset, 'getRawNotes').mockImplementation(() => {});

        await asset.startSync();

        expect(restoreSpy).toHaveBeenCalledTimes(1);
        expect(getRawNotesSpy).toHaveBeenCalledTimes(1);
    });

    it('will not trigger restore if there is already data in note bucket cache', async () => {
        const getCacheSpy = jest.spyOn(noteBucketCache, 'has')
            .mockImplementationOnce(() => true);
        const restoreSpy = jest.spyOn(asset, 'restore');

        await asset.startSync();

        expect(getCacheSpy).toHaveBeenCalledTimes(1);
        expect(restoreSpy).toHaveBeenCalledTimes(0);
    });

    it('processes will be pending if paused/locked', () => {
        const getRawNotesSpy = jest.spyOn(asset, 'getRawNotes');
        const decryptNotesSpy = jest.spyOn(asset, 'decryptNotes');

        asset.pause();
        asset.addProcess(async () => asset.getRawNotes());

        expect(getRawNotesSpy).toHaveBeenCalledTimes(0);
        expect(decryptNotesSpy).toHaveBeenCalledTimes(0);
        expect(asset.activeProcesses.size).toBe(0);
        expect(asset.pendingProcesses.size).toBe(1);
    });

    it('continue with previous pending process if there is any', async () => {
        const addProcessSpy = jest.spyOn(asset, 'addProcess');
        const mockProcess = jest.fn();
        asset.pause();
        asset.addProcess(mockProcess);
        addProcessSpy.mockClear();

        expect(asset.activeProcesses.size).toBe(0);
        expect(asset.pendingProcesses.size).toBe(1);
        expect(mockProcess).toHaveBeenCalledTimes(0);

        await asset.startSync();

        expect(mockProcess).toHaveBeenCalledTimes(1);
        expect(addProcessSpy).toHaveBeenCalledTimes(0);
    });
});

describe('Asset.decryptNotes', () => {
    let errors = [];
    const errorLogSpy = jest.spyOn(console, 'error').mockImplementation((error) => {
        errors.push(error);
    });
    let warnings = [];
    const warnLogSpy = jest.spyOn(console, 'warn').mockImplementation((warning) => {
        warnings.push(warning);
    });

    beforeEach(() => {
        errors = [];
        warnings = [];
        errorLogSpy.mockClear();
        warnLogSpy.mockClear();
    });

    it('can run multiple decryptNotes asynchronously', async () => {
        const totalGroups = 4;
        const noteGroups = [...Array(totalGroups)].map(() => []);
        let balance = 0;
        let maxBlockNumber = 0;
        testNotes.forEach((note, i) => {
            const blockNumber = randomInt(1000);
            noteGroups[i % totalGroups].push({
                ...note,
                assetId,
                blockNumber,
            });
            balance += note.value;
            if (blockNumber > maxBlockNumber) {
                maxBlockNumber = blockNumber;
            }
        });

        const promises = noteGroups.map(async group => asset.decryptNotes(group));
        await Promise.all(promises);

        expect(asset.balance).toBe(balance);
        expect(asset.lastSynced).toBe(maxBlockNumber);
        expect(noteBucketCache.getSize(assetId)).toBe(testNotes.length);
    });

    it('will keep processing valid notes even when catching an error while decrypting an invalid viewing key', async () => {
        const totalNotes = 5;
        let balance = 0;
        const notes = testNotes.slice(0, totalNotes).map((note, i) => {
            balance += note.value;
            return {
                ...note,
                assetId,
                blockNumber: i + 1,
            };
        });
        const invalidNote = notes[Math.floor(totalNotes / 2)];
        invalidNote.viewingKey = `0x${randomId(VIEWING_KEY_LENGTH - 1)}`;
        balance -= invalidNote.value;
        expect(invalidNote.value > 0).toBe(true);

        await asset.decryptNotes(notes);
        expect(errors.length).toBe(1);
        expect(asset.balance).toBe(balance);
        expect(asset.lastSynced).toBe(notes[notes.length - 1].blockNumber);
        expect(noteBucketCache.getSize(assetId)).toBe(totalNotes - 1);
    });

    it('will update lastSync even when the note is invalid', async () => {
        const invalidNote = {
            ...testNotes[0],
            viewingKey: `0x${randomId(VIEWING_KEY_LENGTH - 1)}`,
            blockNumber: 10,
        };

        await asset.decryptNotes([invalidNote]);
        expect(errors.length).toBe(1);
        expect(asset.balance).toBe(0);
        expect(asset.lastSynced).toBe(invalidNote.blockNumber);
        expect(noteBucketCache.getSize(assetId)).toBe(0);
    });
});

describe('Asset.getRawNotes', () => {
    let mockFetchAndRemove;

    beforeEach(() => {
        mockFetchAndRemove = jest.spyOn(rawNoteManager, 'fetchAndRemove')
            .mockImplementation(() => []);
    });

    it('fetch notes and trigger decryptNotes and another getRawNotes', async () => {
        const processes = [];
        const addProcessSpy = jest.spyOn(asset, 'addProcess').mockImplementation((ps) => {
            processes.push(ps);
        });

        const totalNotes = 10;
        mockFetchAndRemove.mockImplementationOnce(() => testNotes.slice(0, totalNotes));

        const decryptNotesSpy = jest.spyOn(asset, 'decryptNotes')
            .mockImplementation(() => jest.fn());

        asset.notesPerDecryptionBatch = 4;
        const decryptionBatches = Math.ceil(totalNotes / asset.notesPerDecryptionBatch);
        await asset.getRawNotes();
        expect(addProcessSpy).toHaveBeenCalledTimes(decryptionBatches + 1);

        const getRawNotesSpy = jest.spyOn(asset, 'getRawNotes')
            .mockImplementationOnce(() => jest.fn());
        await Promise.all(processes.map(ps => ps()));

        expect(decryptNotesSpy).toHaveBeenCalledTimes(decryptionBatches);
        expect(getRawNotesSpy).toHaveBeenCalledTimes(1);
    });

    it('will not trigger any process if no notes are fetched', async () => {
        const addProcessSpy = jest.spyOn(asset, 'addProcess');

        await asset.getRawNotes();

        expect(mockFetchAndRemove).toHaveBeenCalledTimes(1);
        expect(addProcessSpy).toHaveBeenCalledTimes(0);
    });
});

describe('managing asynchronous processes', () => {
    let mockFetchAndRemove;

    beforeEach(() => {
        mockFetchAndRemove = jest.spyOn(rawNoteManager, 'fetchAndRemove')
            .mockImplementation(() => []);
    });

    const testAsynchrounousProcesses = async ({
        notesPerFetch,
        notesPerBatch,
        maxProcesses,
    }) => {
        asset.notesPerDecryptionBatch = notesPerBatch;
        asset.maxProcesses = maxProcesses;

        const getRawNotesSpy = jest.spyOn(asset, 'getRawNotes');
        const decryptNotesSpy = jest.spyOn(asset, 'decryptNotes');

        const activeProcessesLog = [];
        const activeProcesses = new Set();
        const mockActiveProcesses = {
            size: 0,
            add: (ps) => {
                mockActiveProcesses.size += 1;
                activeProcessesLog.push(mockActiveProcesses.size);
                activeProcesses.add(ps);
            },
            delete: (ps) => {
                mockActiveProcesses.size -= 1;
                activeProcessesLog.push(mockActiveProcesses.size);
                activeProcesses.delete(ps);
            },
        };
        asset.activeProcesses = mockActiveProcesses;

        const maxFecth = 5;
        let currentFetch = 0;
        mockFetchAndRemove.mockImplementation(() => {
            if (currentFetch === maxFecth) {
                return [];
            }
            currentFetch += 1;
            return testNotes.slice(
                (currentFetch - 1) * notesPerFetch,
                currentFetch * notesPerFetch,
            );
        });

        const assetSynced = new Promise((resolve) => {
            asset.addListener('synced', resolve);
        });

        asset.startSync();

        await assetSynced;

        const decryptionCount = maxFecth * Math.ceil(notesPerFetch / notesPerBatch);
        expect(decryptNotesSpy).toHaveBeenCalledTimes(decryptionCount);
        expect(getRawNotesSpy).toHaveBeenCalledTimes(maxFecth + 1);

        expect(activeProcessesLog.every(times => times <= asset.maxProcesses)).toBe(true);
        expect(Math.max(...activeProcessesLog)).toBe(asset.maxProcesses);

        const totalNotes = maxFecth * notesPerFetch;
        const expectedBalance = testNotes.slice(0, totalNotes)
            .reduce((sum, { value }) => sum + value, 0);
        expect(asset.balance).toBe(expectedBalance);
    };

    it('will keep fetching and decrypting notes until there is no notes', async () => {
        await testAsynchrounousProcesses({
            notesPerFetch: 6,
            notesPerBatch: 2,
            maxProcesses: 4,
        });
    });

    it('can devide notes into batches of different sizes for decryption', async () => {
        await testAsynchrounousProcesses({
            notesPerFetch: 5,
            notesPerBatch: 3,
            maxProcesses: 4,
        });
    });

    it('can run in single process', async () => {
        await testAsynchrounousProcesses({
            notesPerFetch: 4,
            notesPerBatch: 2,
            maxProcesses: 1,
        });
    });
});
