import * as storage from '~utils/storage';
import NoteManager from '../../helpers/NoteManager';

jest.mock('~utils/storage');

let manager;
let waitInQueueSpy;
const mockTestApi = jest.fn();

beforeEach(() => {
    storage.reset();
    mockTestApi.mockClear();

    manager = new NoteManager();
    manager.testApi = mockTestApi;

    waitInQueueSpy = jest.spyOn(manager, 'waitInQueue')
        .mockImplementation(() => jest.fn());
});

describe('NoteManager.ensureSynced', () => {
    it('will add to queue if is syncing', () => {
        manager.syncing = true;
        manager.ensureSynced('testApi');
        expect(waitInQueueSpy).toHaveBeenCalledTimes(1);
        expect(waitInQueueSpy.mock.calls[0]).toEqual([
            'testApi',
            {},
        ]);
        expect(mockTestApi).toHaveBeenCalledTimes(0);
    });

    it('will add to queue if the asset is syncing', () => {
        manager.syncing = false;
        manager.assetNoteDataMapping = {
            assetId_0: {
                syncing: true,
            },
        };
        manager.ensureSynced('testApi', {
            assetId: 'assetId_0',
        });
        expect(waitInQueueSpy).toHaveBeenCalledTimes(1);
        expect(waitInQueueSpy.mock.calls[0]).toEqual([
            'testApi',
            {
                assetId: 'assetId_0',
            },
        ]);
        expect(mockTestApi).toHaveBeenCalledTimes(0);
    });

    it('will trigger api if neither the assetNoteDataMapping or asset is syncing', () => {
        manager.syncing = false;
        manager.assetNoteDataMapping = {
            assetId_0: {
                syncing: false,
            },
        };
        manager.ensureSynced('testApi', {
            assetId: 'assetId_0',
        });
        expect(waitInQueueSpy).toHaveBeenCalledTimes(0);
        expect(mockTestApi).toHaveBeenCalledTimes(1);
        expect(mockTestApi.mock.calls[0]).toEqual([
            {
                assetId: 'assetId_0',
            },
        ]);
    });
});
