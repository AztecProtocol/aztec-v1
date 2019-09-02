import {
    toCode,
} from '~utils/noteStatus';
import * as storage from '~utils/storage';
import noteModel from '~database/models/note';
import removeDestroyedNotes from '../utils/removeDestroyedNotes';

jest.mock('~utils/storage');

const mockNoteModelGet = jest.fn();
const noteModelGetSpy = jest.spyOn(noteModel, 'get')
    .mockImplementation((...args) => mockNoteModelGet(...args));

beforeEach(() => {
    storage.reset();
    mockNoteModelGet.mockReset();
    noteModelGetSpy.mockClear();
});

describe('removeDestroyedNotes', () => {
    it('remove notes from noteData if that note has been destroyed or not found', async () => {
        mockNoteModelGet.mockImplementation(({
            key,
        }) => {
            if (key === 'n:2') {
                return null;
            }
            if (key === 'n:3') {
                return {
                    status: toCode('DESTROYED'),
                };
            }
            return {
                status: toCode('CREATED'),
            };
        });

        const assetNoteData = {
            balance: 24,
            noteValues: {
                2: ['n:0'],
                5: ['n:1', 'n:2'],
                6: ['n:3', 'n:4'],
            },
            lastSynced: 'n:4',
        };

        const purifiedNoteData = await removeDestroyedNotes(assetNoteData);
        expect(purifiedNoteData).toEqual({
            balance: 13,
            noteValues: {
                2: ['n:0'],
                5: ['n:1'],
                6: ['n:4'],
            },
            lastSynced: 'n:4',
        });
    });

    it('will not change lastSynced even if that note has been destroyed', async () => {
        const assetNoteData = {
            balance: 12,
            noteValues: {
                2: ['n:0'],
                5: ['n:1', 'n:2'],
            },
            lastSynced: 'n:2',
        };

        const purifiedNoteData = await removeDestroyedNotes(assetNoteData);
        expect(purifiedNoteData).toEqual({
            balance: 0,
            noteValues: {
                2: [],
                5: [],
            },
            lastSynced: 'n:2',
        });
    });
});
