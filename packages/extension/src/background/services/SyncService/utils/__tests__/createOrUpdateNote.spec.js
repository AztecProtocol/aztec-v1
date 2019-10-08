import * as storage from '~utils/storage';
import {
    toCode,
} from '~utils/noteStatus';
import noteModel from '~database/models/note';
import createOrUpdateNote from '../addNote/createOrUpdateNote';

jest.mock('~utils/storage');
jest.mock('~utils/note', () => ({
    valueFromViewingKey: jest.fn(),
    valueOf: jest.fn(() => 100),
}));
jest.mock('~utils/encryptedViewingKey', () => ({
    fromHexString: jest.fn(() => ({
        decrypt: jest.fn(),
    })),
}));
jest.mock('~background/services/NoteService');

const setSpy = jest.spyOn(storage, 'set');

beforeEach(() => {
    storage.reset();
    setSpy.mockClear();
});

describe('createOrUpdateNote', () => {
    let numberOfNotes = 0;

    const assets = [
        {
            key: 'a:0',
            address: '0xabc',
        },
        {
            key: 'a:1',
            address: '0xdef',
        },
    ];

    const users = [
        {
            address: '0x0',
        },
        {
            address: '0x1',
        },
    ];

    const note = {
        hash: '0x123',
        viewingKey: '0xabc',
        assetKey: 'a:0',
        asset: assets[0],
        account: users[0],
        owner: users[0],
        status: 'CREATED',
    };

    const newNote = (prevNote) => {
        numberOfNotes += 1;
        return {
            ...prevNote,
            hash: `${prevNote.hash}${numberOfNotes}`,
        };
    };

    const privateKey = '012345';

    const value = 100;

    beforeEach(() => {
        numberOfNotes = 0;
    });

    it('set note and assetValue to storage', async () => {
        const dataBefore = await storage.get([
            'noteCount',
            note.hash,
            'n:0',
        ]);
        expect(dataBefore).toEqual({});

        await createOrUpdateNote(note, privateKey);

        const dataAfter = await storage.get([
            'noteCount',
            note.hash,
        ]);
        expect(dataAfter).toEqual({
            noteCount: 1,
            [note.hash]: 'n:0',
        });

        const savedNote = await noteModel.get({
            hash: note.hash,
        });
        expect(savedNote).toMatchObject({
            value,
            asset: note.assetKey,
            owner: note.ownerKey,
            status: toCode(note.status),
        });
    });

    it('increase count when adding different notes to storage', async () => {
        const countBefore = await storage.get('noteCount');
        expect(countBefore).toBeUndefined();

        await createOrUpdateNote(note, privateKey);
        const count0 = await storage.get('noteCount');
        expect(count0).toEqual(1);

        await createOrUpdateNote(note, privateKey);
        const count1 = await storage.get('noteCount');
        expect(count1).toEqual(1);

        await createOrUpdateNote(newNote(note), privateKey);
        const count2 = await storage.get('noteCount');
        expect(count2).toEqual(2);
    });

    it('will not call set when adding existing note to storage', async () => {
        await createOrUpdateNote(note, privateKey);
        expect(setSpy).toHaveBeenCalled();

        setSpy.mockClear();
        await createOrUpdateNote(note, privateKey);
        expect(setSpy).not.toHaveBeenCalled();

        setSpy.mockClear();
        await createOrUpdateNote(newNote(note), privateKey);
        expect(setSpy).toHaveBeenCalled();
    });

    it('will update storage if some data is changed in existing note', async () => {
        await createOrUpdateNote(note, privateKey);
        expect(setSpy).toHaveBeenCalled();
        const savedNote = await noteModel.get({
            hash: note.hash,
        });
        expect(savedNote).toMatchObject({
            value,
            asset: note.assetKey,
            status: toCode(note.status),
        });

        const updatedNote = {
            ...note,
            status: 'DESTROYED',
        };
        setSpy.mockClear();
        await createOrUpdateNote(updatedNote, privateKey);
        expect(setSpy).toHaveBeenCalled();

        const updatedSavedNote = await noteModel.get({
            hash: note.hash,
        });
        expect(updatedSavedNote).toEqual({
            ...savedNote,
            status: toCode(updatedNote.status),
        });
    });

    it('will not call set if changed data is not stored in model', async () => {
        await createOrUpdateNote(note, privateKey);
        expect(setSpy).toHaveBeenCalled();

        setSpy.mockClear();
        await createOrUpdateNote({
            ...note,
            whaever: '',
        }, privateKey);
        expect(setSpy).not.toHaveBeenCalled();
    });
});
