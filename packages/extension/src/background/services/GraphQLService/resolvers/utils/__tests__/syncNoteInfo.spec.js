import {
    userAccount,
    userAccount2,
} from '~helpers/testUsers';
import {
    createNote,
} from '~utils/note';
import * as storage from '~utils/storage';
import encryptedViewingKey from '~utils/encryptedViewingKey';
import SyncService from '~background/services/SyncService';
import noteModel from '~database/models/note';
import syncNoteInfo from '../syncNoteInfo';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

afterEach(() => {
    storage.reset();
});

describe('syncNoteInfo', () => {
    const noteValue = 10;
    let noteData;

    const syncNoteSpy = jest.spyOn(SyncService, 'syncNote')
        .mockImplementation(() => noteData);

    beforeAll(async () => {
        const {
            address,
            linkedPublicKey,
            spendingPublicKey,
        } = userAccount;
        const note = await createNote(noteValue, spendingPublicKey, address);
        const {
            noteHash,
            viewingKey: realViewingKey,
        } = note.exportNote();
        const viewingKey = await encryptedViewingKey(linkedPublicKey, realViewingKey);

        noteData = {
            hash: noteHash,
            viewingKey: viewingKey.toHexString(),
            owner: address,
        };
    });

    afterEach(() => {
        syncNoteSpy.mockClear();
    });

    afterAll(() => {
        syncNoteSpy.mockRestore();
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

        expect(syncNoteSpy.mock.calls.length).toBe(0);
    });

    it('return null if id is empty in args', async () => {
        await noteModel.set(noteData);

        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: '',
        });
        expect(response).toEqual(null);

        expect(syncNoteSpy.mock.calls.length).toBe(0);
    });

    it('get note on chain if not found in storage', async () => {
        const response = await storyOf('ensureDomainPermission', syncNoteInfo, {
            id: noteData.hash,
        });
        expect(response).toEqual({
            ...noteData,
            value: noteValue,
        });

        expect(syncNoteSpy.mock.calls.length).toBe(1);
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

        expect(syncNoteSpy.mock.calls.length).toBe(1);
    });
});
