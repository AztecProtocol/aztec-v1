import * as storage from '~/utils/storage';
import NoteBucketCache from '../helpers/NoteBucketCache';
import sizeOfNoteValues from '../utils/sizeOfNoteValues';
import {
    assetNotes,
    assetSummary,
    priority,
} from './testData';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

const INCREASE_PRIORITY = true;
const assetIds = Object.keys(assetNotes);
let noteBucket;

beforeEach(() => {
    noteBucket = new NoteBucketCache();
});

describe('NoteBucketCache .add and .get', () => {
    it('add one note at a time', () => {
        const assetId = assetIds[0];
        noteBucket.add(assetId, {
            key: 'n:0',
            value: 5,
        });
        noteBucket.add(assetId, {
            key: 'n:1',
            value: 2,
        });
        expect(noteBucket.get(assetId)).toEqual({
            2: ['n:1'],
            5: ['n:0'],
        });
        expect(noteBucket.getSize(assetId)).toBe(2);

        noteBucket.add(assetId, {
            key: 'n:2',
            value: 2,
        });
        expect(noteBucket.get(assetId)).toEqual({
            2: ['n:1', 'n:2'],
            5: ['n:0'],
        });
        expect(noteBucket.getSize(assetId)).toBe(3);
    });

    it('remove asset with the least priority if total notes exceed max notes', () => {
        noteBucket = new NoteBucketCache({
            maxNotes: 3,
        });

        const assetId0 = assetIds[0];
        const assetId1 = assetIds[1];
        const assetId2 = assetIds[2];

        noteBucket.add(assetId0, {
            key: 'n:0',
            value: 5,
        });
        noteBucket.add(assetId1, {
            key: 'n:1',
            value: 2,
        });
        noteBucket.add(assetId2, {
            key: 'n:2',
            value: 3,
        });

        expect(noteBucket.get(assetId0)).toEqual({
            5: ['n:0'],
        });
        expect(noteBucket.get(assetId1)).toEqual({
            2: ['n:1'],
        });
        expect(noteBucket.get(assetId2)).toEqual({
            3: ['n:2'],
        });
        expect(noteBucket.getSize(assetId0)).toBe(1);
        expect(noteBucket.getSize(assetId1)).toBe(1);
        expect(noteBucket.getSize(assetId2)).toBe(1);
        expect(noteBucket.has(assetId0)).toBe(true);
        expect(noteBucket.has(assetId1)).toBe(true);
        expect(noteBucket.has(assetId2)).toBe(true);

        noteBucket.add(assetId1, {
            key: 'n:3',
            value: 2,
        });
        expect(noteBucket.get(assetId0)).toEqual(null);
        expect(noteBucket.get(assetId1)).toEqual({
            2: ['n:1', 'n:3'],
        });
        expect(noteBucket.get(assetId2)).toEqual({
            3: ['n:2'],
        });
        expect(noteBucket.getSize(assetId0)).toBe(0);
        expect(noteBucket.getSize(assetId1)).toBe(2);
        expect(noteBucket.getSize(assetId2)).toBe(1);
        expect(noteBucket.has(assetId0)).toBe(false);
        expect(noteBucket.has(assetId1)).toBe(true);
        expect(noteBucket.has(assetId2)).toBe(true);

        noteBucket.add(assetId0, {
            key: 'n:0',
            value: 5,
        });
        expect(noteBucket.get(assetId0)).toEqual({
            5: ['n:0'],
        });
        expect(noteBucket.get(assetId1)).toEqual(null);
        expect(noteBucket.get(assetId2)).toEqual({
            3: ['n:2'],
        });
        expect(noteBucket.getSize(assetId0)).toBe(1);
        expect(noteBucket.getSize(assetId1)).toBe(0);
        expect(noteBucket.getSize(assetId2)).toBe(1);
        expect(noteBucket.has(assetId0)).toBe(true);
        expect(noteBucket.has(assetId1)).toBe(false);
        expect(noteBucket.has(assetId2)).toBe(true);
    });

    it('can increase priority while adding notes', () => {
        noteBucket = new NoteBucketCache({
            maxNotes: 3,
        });

        const assetId0 = assetIds[0];
        const assetId1 = assetIds[1];
        const assetId2 = assetIds[2];

        noteBucket.add(assetId0, {
            key: 'n:0',
            value: 5,
        });
        noteBucket.add(assetId1, {
            key: 'n:1',
            value: 2,
        });
        noteBucket.add(assetId2, {
            key: 'n:2',
            value: 3,
        });

        expect(noteBucket.get(assetId0)).toEqual({
            5: ['n:0'],
        });
        expect(noteBucket.get(assetId1)).toEqual({
            2: ['n:1'],
        });
        expect(noteBucket.get(assetId2)).toEqual({
            3: ['n:2'],
        });
        expect(noteBucket.getSize(assetId0)).toBe(1);
        expect(noteBucket.getSize(assetId1)).toBe(1);
        expect(noteBucket.getSize(assetId2)).toBe(1);

        noteBucket.add(assetId1, {
            key: 'n:3',
            value: 2,
        }, INCREASE_PRIORITY);
        expect(noteBucket.get(assetId0)).toEqual(null);
        expect(noteBucket.get(assetId1)).toEqual({
            2: ['n:1', 'n:3'],
        });
        expect(noteBucket.get(assetId2)).toEqual({
            3: ['n:2'],
        });
        expect(noteBucket.getSize(assetId0)).toBe(0);
        expect(noteBucket.getSize(assetId1)).toBe(2);
        expect(noteBucket.getSize(assetId2)).toBe(1);

        noteBucket.add(assetId0, {
            key: 'n:0',
            value: 5,
        });
        expect(noteBucket.get(assetId0)).toEqual({
            5: ['n:0'],
        });
        expect(noteBucket.get(assetId1)).toEqual({
            2: ['n:1', 'n:3'],
        });
        expect(noteBucket.get(assetId2)).toEqual(null);
        expect(noteBucket.getSize(assetId0)).toBe(1);
        expect(noteBucket.getSize(assetId1)).toBe(2);
        expect(noteBucket.getSize(assetId2)).toBe(0);
    });
});

describe('NoteBucketCache.set', () => {
    it('set the entire note values for an asset', () => {
        const asset0 = assetIds[0];
        const noteValues0 = assetNotes[asset0];

        const asset1 = assetIds[1];
        const noteValues1 = assetNotes[asset1];

        noteBucket.set(asset0, noteValues0);
        noteBucket.set(asset1, noteValues1);

        expect(noteBucket.cache.get(asset0)).toBe(noteValues0);
        expect(noteBucket.getSize(asset0)).toBe(sizeOfNoteValues(noteValues0));

        expect(noteBucket.cache.get(asset1)).toBe(noteValues1);
        expect(noteBucket.getSize(asset1)).toBe(sizeOfNoteValues(noteValues1));
    });

    it('override previous data of the same asset', () => {
        const asset0 = assetIds[0];
        const noteValues0 = assetNotes[asset0];

        const asset1 = assetIds[1];
        const noteValues1 = assetNotes[asset1];

        noteBucket.set(asset0, noteValues0);
        expect(noteBucket.cache.get(asset0)).toBe(noteValues0);
        expect(noteBucket.getSize(asset0)).toBe(sizeOfNoteValues(noteValues0));

        noteBucket.set(asset0, noteValues1);
        expect(noteBucket.cache.get(asset0)).toBe(noteValues1);
        expect(noteBucket.getSize(asset0)).toBe(sizeOfNoteValues(noteValues1));
    });

    it('remove asset with the least priority if total notes exceed max notes', () => {
        const asset0 = assetIds[0];
        const noteValues0 = assetNotes[asset0];
        const size0 = sizeOfNoteValues(noteValues0);

        const asset1 = assetIds[1];
        const noteValues1 = assetNotes[asset1];

        noteBucket = new NoteBucketCache({
            maxNotes: size0,
        });

        noteBucket.set(asset0, noteValues0);
        expect(noteBucket.cache.get(asset0)).toBe(noteValues0);
        expect(noteBucket.cache.get(asset1)).toBe(undefined);
        expect(noteBucket.getSize(asset0)).toBe(sizeOfNoteValues(noteValues0));
        expect(noteBucket.getSize(asset1)).toBe(0);

        noteBucket.set(asset1, noteValues1);
        expect(noteBucket.cache.get(asset0)).toBe(undefined);
        expect(noteBucket.cache.get(asset1)).toBe(noteValues1);
        expect(noteBucket.getSize(asset0)).toBe(0);
        expect(noteBucket.getSize(asset1)).toBe(sizeOfNoteValues(noteValues1));
    });
});

describe('NoteBucketCache import/export', () => {
    it('take asset summary, notes, and priority queue to init the data', () => {
        noteBucket.import({
            assetSummary,
            assetNotes,
            priority,
        });

        expect(noteBucket.cache.priorityQueue.export()).toEqual(priority);
        Object.keys(assetNotes).forEach((assetId) => {
            expect(noteBucket.cache.get(assetId)).toEqual(assetNotes[assetId]);
        });

        const data = noteBucket.export();
        expect(data).toEqual({
            assetNotes,
            priority,
        });
    });

    it('allow to limit max number of assets in cache when initialized', () => {
        const cacheManager = new NoteBucketCache({
            maxAssets: 1,
        });
        cacheManager.import({
            assetSummary,
            assetNotes,
            priority,
        });

        const [firstAsset] = priority;
        expect(cacheManager.cache.priorityQueue.export()).toEqual([firstAsset]);
        expect(cacheManager.cache.get(priority[1])).toBe(undefined);
        expect(cacheManager.cache.get(firstAsset)).toEqual(assetNotes[firstAsset]);
    });

    it('allow to limit max number of notes in cache when initialized', () => {
        const [firstAsset] = priority;
        const maxNotes = assetSummary[firstAsset].size + 1;
        const cacheManager = new NoteBucketCache({
            maxNotes,
        });

        cacheManager.import({
            assetSummary,
            assetNotes,
            priority,
        });

        expect(cacheManager.cache.priorityQueue.export()).toEqual([firstAsset]);
        expect(cacheManager.memoryUsage).toBe(assetSummary[firstAsset].size);
        expect(cacheManager.cache.get(priority[1])).toBe(undefined);
        expect(cacheManager.cache.get(firstAsset)).toEqual(assetNotes[firstAsset]);
    });

    it('can exceed max number of notes with the asset of the highest priority', () => {
        const [firstAsset] = priority;
        const maxNotes = assetSummary[firstAsset].size - 1;
        const cacheManager = new NoteBucketCache({
            maxNotes,
        });

        cacheManager.import({
            assetSummary,
            assetNotes,
            priority,
        });

        expect(cacheManager.cache.priorityQueue.export()).toEqual([firstAsset]);
        expect(cacheManager.memoryUsage).toBe(assetSummary[firstAsset].size);
        expect(cacheManager.cache.get(priority[1])).toBe(undefined);
        expect(cacheManager.cache.get(firstAsset)).toEqual(assetNotes[firstAsset]);
    });
});
