import * as storage from '~utils/storage';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

let manager;
const mockTestApi = jest.fn();

beforeEach(async () => {
    storage.reset();
    mockTestApi.mockClear();

    manager = new NoteManager();
    manager.testApi = mockTestApi;
});

describe('NoteManager.waitInQueue', () => {
    it('will add api name and args to queue and return a promise', () => {
        expect(manager.queue).toEqual([]);

        const queuePromise = manager.waitInQueue('testApi', {
            assetId: 'assetId_0',
        });
        expect(queuePromise).toBeInstanceOf(Promise);

        expect(manager.queue).toEqual([
            {
                method: 'testApi',
                args: {
                    assetId: 'assetId_0',
                },
                resolve: expect.any(Function),
            },
        ]);
    });
});

describe('NoteManager.flushQueue', () => {
    it('trigger all the callbacks in queue', async () => {
        const results = [];
        mockTestApi.mockImplementation((args) => {
            results.push(args);
        });

        manager.waitInQueue('testApi', {
            assetId: 'assetId_0',
        });
        manager.waitInQueue('testApi', {
            assetId: 'assetId_1',
        });
        expect(manager.queue.length).toBe(2);

        expect(results).toEqual([]);
        expect(mockTestApi).toHaveBeenCalledTimes(0);

        await manager.flushQueue();

        expect(results).toEqual([
            {
                assetId: 'assetId_0',
            },
            {
                assetId: 'assetId_1',
            },
        ]);
        expect(mockTestApi).toHaveBeenCalledTimes(2);
    });

    it('will not trigger callbacks in queue if data is still syncing', async () => {
        const results = [];
        mockTestApi.mockImplementation((args) => {
            results.push(args);
        });

        manager.waitInQueue('testApi', {
            assetId: 'assetId_0',
        });
        manager.waitInQueue('testApi', {
            assetId: 'assetId_1',
        });
        expect(manager.queue.length).toBe(2);

        manager.syncing = true;

        expect(results).toEqual([]);

        await manager.flushQueue();

        expect(results).toEqual([]);
        expect(mockTestApi).toHaveBeenCalledTimes(0);
    });

    it('skip callbacks in queue whose asset is still syncing', async () => {
        const results = [];
        mockTestApi.mockImplementation((args) => {
            results.push(args);
        });

        manager.waitInQueue('testApi', {
            assetId: 'assetId_0',
        });
        manager.waitInQueue('testApi', {
            assetId: 'assetId_1',
        });
        manager.waitInQueue('testApi', {
            assetId: 'assetId_0',
        });
        manager.waitInQueue('testApi', {
            foo: 'bar',
        });
        expect(manager.queue.length).toBe(4);

        manager.assetNoteDataMapping = {
            assetId_0: {
                syncing: true,
            },
        };

        expect(results).toEqual([]);
        expect(mockTestApi).toHaveBeenCalledTimes(0);

        await manager.flushQueue();

        expect(results).toEqual([
            {
                assetId: 'assetId_1',
            },
            {
                foo: 'bar',
            },
        ]);
        expect(mockTestApi).toHaveBeenCalledTimes(2);
    });
});
