import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
// import GraphNodeService from '~background/services/GraphNodeService';
import noteModel from '~database/models/note';
import syncUtilityNoteInfo from '../syncUtilityNoteInfo';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('syncUtilityNoteInfo', () => {
    const noteData = {
        id: 'note_id',
        hash: 'note_hash',
        metadata: 'note_metadata',
        asset: {
            id: 'asset_id',
        },
    };

    const expectedNoteResponse = {
        ...noteData,
        asset: noteData.asset.id,
    };

    const querySpy = jest.spyOn(GraphNodeService, 'query')
        .mockImplementation(() => ({
            note: noteData,
        }));

    beforeEach(() => {
        querySpy.mockClear();
    });

    afterAll(() => {
        querySpy.mockRestore();
    });

    it('get utility note on chain', async () => {
        const response = await storyOf('ensureDomainPermission', syncUtilityNoteInfo, {
            id: noteData.id,
        });

        const note = await noteModel.get({
            id: noteData.id,
        });
        expect(note).toBe(null);

        expect(response).toEqual(expectedNoteResponse);

        expect(querySpy).toHaveBeenCalledTimes(1);
    });

    it('return null if id is empty in args', async () => {
        const response = await storyOf('ensureDomainPermission', syncUtilityNoteInfo, {
            id: '',
        });
        expect(response).toEqual(null);

        expect(querySpy).not.toHaveBeenCalled();
    });

    it('throw error if note is not found on chain', async () => {
        querySpy.mockImplementationOnce(() => ({
            note: null,
        }));

        await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            syncUtilityNoteInfo,
            {
                id: noteData.id,
            },
        )).toBe('utilityNote.not.found.onChain');

        expect(querySpy).toHaveBeenCalledTimes(1);
    });
});
