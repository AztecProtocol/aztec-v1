import {
    ONCHAIN_METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
import {
    randomId,
} from '~utils/random';
import GraphNodeService from '~background/services/GraphNodeService';
import noteModel from '~database/models/note';
import syncUtilityNoteInfo from '../syncUtilityNoteInfo';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('syncUtilityNoteInfo', () => {
    const noteData = {
        id: 'note_id',
        hash: 'note_hash',
        metadata: '',
        asset: {
            id: 'asset_id',
        },
    };

    const expectedNoteResponse = {
        ...noteData,
        asset: noteData.asset.id,
        metadata: '',
    };

    const querySpy = jest.spyOn(GraphNodeService, 'query')
        .mockImplementation(() => ({
            note: noteData,
        }));

    afterEach(() => {
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

        expect(querySpy.mock.calls.length).toBe(1);
    });

    it('return null if id is empty in args', async () => {
        const response = await storyOf('ensureDomainPermission', syncUtilityNoteInfo, {
            id: '',
        });
        expect(response).toEqual(null);

        expect(querySpy.mock.calls.length).toBe(0);
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

        expect(querySpy.mock.calls.length).toBe(1);
    });

    it('remove aztec data from metadata', async () => {
        const customMetadataLen = 10;
        const metadata = `0x${randomId(ONCHAIN_METADATA_AZTEC_DATA_LENGTH + customMetadataLen)}`;
        querySpy.mockImplementationOnce(() => ({
            note: {
                ...noteData,
                metadata,
            },
        }));

        const response = await storyOf('ensureDomainPermission', syncUtilityNoteInfo, {
            id: noteData.id,
        });

        const expectedMetadata = metadata.slice(ONCHAIN_METADATA_AZTEC_DATA_LENGTH + 2);
        expect(response).toEqual({
            ...expectedNoteResponse,
            metadata: expectedMetadata,
        });
        expect(response.metadata.length).toBe(customMetadataLen);
    });
});
