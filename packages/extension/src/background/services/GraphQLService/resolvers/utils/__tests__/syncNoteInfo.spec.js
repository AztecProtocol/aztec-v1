import {
    metadata as toMetadataObj,
} from '@aztec/note-access';
import notes from '~testHelpers/testNotes';
import {
    userAccount,
    userAccount2,
} from '~testHelpers/testUsers';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import * as storage from '~/utils/storage';
import {
    randomInt,
} from '~/utils/random';
import noteModel from '~/background/database/models/note';
import * as syncLatestNoteOnChain from '../syncLatestNoteOnChain';
import syncNoteInfo from '../syncNoteInfo';
import storyOf from './helpers/stories';

jest.mock('~/utils/storage');

beforeEach(() => {
    storage.reset();
});

const generateMetadataStr = (access) => {
    const metadataObj = toMetadataObj('');
    metadataObj.addAccess(access);
    return `0x${''.padEnd(METADATA_AZTEC_DATA_LENGTH, '0')}${metadataObj.toString().slice(2)}`;
};

describe('syncNoteInfo', () => {
    let testNote;
    let noteValue;
    let noteData;

    const noteModelSpy = jest.spyOn(noteModel, 'get')
        .mockImplementation(() => noteData);

    const syncNoteSpy = jest.spyOn(syncLatestNoteOnChain, 'default')
        .mockImplementation(() => noteData);

    beforeAll(() => {
        testNote = notes[randomInt(0, notes.length - 1)];
        const {
            hash,
            viewingKey,
            value,
        } = testNote;
        const metadata = generateMetadataStr({
            address: userAccount.address,
            viewingKey,
        });

        noteValue = value;
        noteData = {
            noteHash: hash,
            metadata,
            owner: userAccount,
        };
    });

    beforeEach(() => {
        syncNoteSpy.mockClear();
        noteModelSpy.mockClear();
    });

    afterAll(() => {
        syncNoteSpy.restore();
        noteModelSpy.restore();
    });

    it('return existing note info in note model', async () => {
        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.noteHash,
        });

        expect(response).toEqual({
            ...noteData,
            value: noteValue,
        });

        expect(noteModelSpy).toHaveBeenCalledTimes(1);
        expect(syncNoteSpy).not.toHaveBeenCalled();
    });

    it('return null if id is empty in args', async () => {
        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: '',
        });
        expect(response).toEqual(null);
        expect(noteModelSpy).not.toHaveBeenCalled();
        expect(syncNoteSpy).not.toHaveBeenCalled();
    });

    it('get note on chain if not found in storage', async () => {
        noteModelSpy.mockImplementationOnce(() => null);

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.noteHash,
        });

        expect(response).toEqual({
            ...noteData,
            value: noteValue,
        });

        expect(noteModelSpy).toHaveBeenCalledTimes(1);
        expect(syncNoteSpy).toHaveBeenCalledTimes(1);
    });

    it('return a note with undefined value if the user does not have access', async () => {
        const {
            viewingKey,
        } = testNote;
        const metadata = generateMetadataStr.toString({
            address: userAccount2.address,
            viewingKey,
        });

        noteModelSpy.mockImplementationOnce(() => ({
            ...noteData,
            metadata,
        }));

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.noteHash,
        });

        expect(response).toEqual({
            ...noteData,
            metadata,
            value: undefined,
        });

        expect(noteModelSpy).toHaveBeenCalledTimes(1);
        expect(syncNoteSpy).not.toHaveBeenCalled();
    });
});
