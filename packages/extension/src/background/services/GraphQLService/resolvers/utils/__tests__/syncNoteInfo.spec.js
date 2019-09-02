import notes from '~helpers/testNotes';
import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import * as storage from '~utils/storage';
import {
    randomInt,
} from '~utils/random';
import SyncService from '~background/services/SyncService';
import noteModel from '~database/models/note';
import syncNoteInfo from '../syncNoteInfo';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('syncNoteInfo', () => {
    let noteValue;
    let noteData;

    const syncNoteSpy = jest.spyOn(SyncService, 'syncNote')
        .mockImplementation(() => noteData);

    beforeAll(async () => {
        const {
            hash,
            viewingKey,
            value,
        } = notes[randomInt(0, notes.length - 1)];
        noteValue = value;
        noteData = {
            hash,
            viewingKey,
            owner: userAccount.address,
        };
    });

    beforeEach(() => {
        syncNoteSpy.mockClear();
    });

    it('return existing note info in storage', async () => {
        await noteModel.set(noteData);

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.hash,
        });

        const note = await noteModel.get({
            id: noteData.hash,
        });
        expect(response).toEqual({
            ...note,
            value: noteValue,
        });

        expect(syncNoteSpy).not.toHaveBeenCalled();
    });

    it('return null if id is empty in args', async () => {
        await noteModel.set(noteData);

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: '',
        });
        expect(response).toEqual(null);

        expect(syncNoteSpy).not.toHaveBeenCalled();
    });

    it('get note on chain if not found in storage', async () => {
        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.hash,
        });
        expect(response).toEqual({
            ...noteData,
            value: noteValue,
        });

        expect(syncNoteSpy).toHaveBeenCalledTimes(1);
    });

    it('re-fetch a note from blockchain if the note in storage belongs to other account', async () => {
        await noteModel.set({
            ...noteData,
            owner: userAccount2.address,
        });

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.hash,
        });
        expect(response).toEqual({
            ...noteData,
            value: noteValue,
        });

        expect(syncNoteSpy).toHaveBeenCalledTimes(1);
    });
});
