import {
    spy,
} from 'sinon';
import * as storage from '~utils/storage';
import {
    fromAction,
} from '~utils/noteStatus';
import noteModel from '~database/models/note';
import noteStorage from '../noteStorage';

jest.mock('~utils/storage');

describe('createOrUpdate', () => {
    let set;
    let numberOfNotes = 0;

    const assets = [
        {
            id: 'asset_0',
            key: 'a:0',
        },
        {
            id: 'asset_1',
            key: 'a:1',
        },
    ];

    const users = [
        {
            id: 'user_0',
        },
        {
            id: 'user_1',
        },
    ];

    const note = {
        id: '123',
        assetKey: 'a:0',
        asset: assets[0],
        account: users[0],
        owner: users[0],
        action: 'CREATE',
    };

    const withAsset = (assetIndex, prevNote = note) => ({
        ...prevNote,
        asset: assets[assetIndex],
        assetKey: assets[assetIndex].key,
    });

    const newNote = (prevNote) => {
        numberOfNotes += 1;
        return {
            ...prevNote,
            id: `${prevNote.id}${numberOfNotes}`,
        };
    };

    const value = 100;

    beforeEach(() => {
        numberOfNotes = 0;
        set = spy(storage, 'set');
    });

    afterEach(() => {
        set.restore();
        storage.reset();
    });

    it('set note and assetValue to storage', async () => {
        const assetValueGroupKey = `${note.assetKey}v:${value}`;

        const dataBefore = await storage.get([
            'noteCount',
            note.id,
            'n:0',
            assetValueGroupKey,
        ]);
        expect(dataBefore).toEqual({});

        await noteStorage.createOrUpdate(note);

        const dataAfter = await storage.get([
            'noteCount',
            note.id,
            assetValueGroupKey,
        ]);
        expect(dataAfter).toEqual({
            noteCount: 1,
            [note.id]: 'n:0',
            [assetValueGroupKey]: ['n:0'],
        });

        const savedNote = await noteModel.get({
            id: note.id,
        });
        expect(savedNote).toEqual({
            value,
            asset: note.assetKey,
            status: fromAction(note.action),
        });
    });

    it('increase count when adding different notes to storage', async () => {
        const countBefore = await storage.get('noteCount');
        expect(countBefore).toBeUndefined();

        await noteStorage.createOrUpdate(note);
        const count0 = await storage.get('noteCount');
        expect(count0).toEqual(1);

        await noteStorage.createOrUpdate(note);
        const count1 = await storage.get('noteCount');
        expect(count1).toEqual(1);

        await noteStorage.createOrUpdate(newNote(note));
        const count2 = await storage.get('noteCount');
        expect(count2).toEqual(2);
    });

    it('push note keys to existing assetValue array when adding notes with the same asset', async () => {
        await noteStorage.createOrUpdate(note);
        const assetValueGroupKey = `${note.assetKey}v:${value}`;
        const data0 = await storage.get([
            assetValueGroupKey,
        ]);
        expect(data0).toEqual({
            [assetValueGroupKey]: ['n:0'],
        });

        await noteStorage.createOrUpdate(newNote(note));
        const data1 = await storage.get([
            assetValueGroupKey,
        ]);
        expect(data1).toEqual({
            [assetValueGroupKey]: ['n:0', 'n:1'],
        });
    });

    it('push note keys to different assetValue array when adding notes with different assets', async () => {
        const note0 = newNote(withAsset(0));
        await noteStorage.createOrUpdate(note0);
        const assetValueGroupKey0 = `${note0.assetKey}v:${value}`;
        const data0 = await storage.get([
            assetValueGroupKey0,
        ]);
        expect(data0).toEqual({
            [assetValueGroupKey0]: ['n:0'],
        });

        const note1 = newNote(withAsset(1));
        await noteStorage.createOrUpdate(note1);
        const assetValueGroupKey1 = `${note1.assetKey}v:${value}`;
        const data1 = await storage.get([
            assetValueGroupKey0,
            assetValueGroupKey1,
        ]);
        expect(data1).toEqual({
            [assetValueGroupKey0]: ['n:0'],
            [assetValueGroupKey1]: ['n:1'],
        });
    });

    it('will not call set when adding existing note to storage', async () => {
        await noteStorage.createOrUpdate(note);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);

        await noteStorage.createOrUpdate(note);
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 === numberOfSet0).toBe(true);

        await noteStorage.createOrUpdate(newNote(note));
        const numberOfSet2 = set.callCount;
        expect(numberOfSet2 === 2 * numberOfSet1).toBe(true);
    });

    it('will update storage if some data is changed in existing note', async () => {
        await noteStorage.createOrUpdate(note);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);
        const savedNote = await noteModel.get({
            id: note.id,
        });
        expect(savedNote).toEqual({
            value,
            asset: note.assetKey,
            status: fromAction(note.action),
        });

        const updatedNote = {
            ...note,
            action: 'DESTROY',
        };
        await noteStorage.createOrUpdate(updatedNote);
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 > numberOfSet0).toBe(true);

        const updatedSavedNote = await noteModel.get({
            id: note.id,
        });
        expect(updatedSavedNote).toEqual({
            ...savedNote,
            status: fromAction(updatedNote.action),
        });
    });

    it('will not call set if changed data is not stored in model', async () => {
        await noteStorage.createOrUpdate(note);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);

        await noteStorage.createOrUpdate({
            ...note,
            whaever: '',
        });
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 === numberOfSet0).toBe(true);
    });
});
