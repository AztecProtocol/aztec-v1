import {
    spy,
} from 'sinon';
import * as storage from '~utils/storage';
import noteStorage from '../noteStorage';

jest.mock('~utils/storage');

describe('createOrUpdate', () => {
    let set;

    const notes = [
        {
            id: '123',
            assetKey: 'a:0',
        },
        {
            id: '456',
            assetKey: 'a:1',
        },
        {
            id: '789',
            assetKey: 'a:1',
        },
    ];

    const value = 100;

    beforeEach(() => {
        set = spy(storage, 'set');
    });

    afterEach(() => {
        set.restore();
        storage.reset();
    });

    it('set note and assetValue to storage', async () => {
        const assetValueGroupKey = `${notes[0].assetKey}v:${value}`;

        const dataBefore = await storage.get([
            'noteCount',
            notes[0].id,
            'n:0',
            assetValueGroupKey,
        ]);
        expect(dataBefore).toEqual({});

        await noteStorage.createOrUpdate(notes[0]);

        const dataAfter = await storage.get([
            'noteCount',
            notes[0].id,
            'n:0',
            assetValueGroupKey,
        ]);
        expect(dataAfter).toEqual({
            noteCount: 1,
            [notes[0].id]: 'n:0',
            'n:0': {
                value,
                asset: 'a:0',
            },
            [assetValueGroupKey]: ['n:0'],
        });
    });

    it('increase count when adding different notes to storage', async () => {
        await noteStorage.createOrUpdate(notes[0]);
        const data0 = await storage.get([
            'noteCount',
            notes[0].id,
        ]);
        expect(data0).toEqual({
            noteCount: 1,
            [notes[0].id]: 'n:0',
        });

        await noteStorage.createOrUpdate(notes[1]);
        const data1 = await storage.get([
            'noteCount',
            notes[1].id,
        ]);
        expect(data1).toEqual({
            noteCount: 2,
            [notes[1].id]: 'n:1',
        });
    });

    it('push note keys to existing assetValue array when adding notes with the same asset', async () => {
        await noteStorage.createOrUpdate(notes[1]);
        const assetValueGroupKey0 = `${notes[1].assetKey}v:${value}`;
        const data0 = await storage.get([
            assetValueGroupKey0,
        ]);
        expect(data0).toEqual({
            [assetValueGroupKey0]: ['n:0'],
        });

        await noteStorage.createOrUpdate(notes[2]);
        const assetValueGroupKey1 = `${notes[1].assetKey}v:${value}`;
        const data1 = await storage.get([
            assetValueGroupKey1,
        ]);
        expect(data1).toEqual({
            [assetValueGroupKey0]: ['n:0', 'n:1'],
        });
    });

    it('will not call set when adding existing note to storage', async () => {
        await noteStorage.createOrUpdate(notes[0]);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);

        await noteStorage.createOrUpdate(notes[0]);
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 === numberOfSet0).toBe(true);

        await noteStorage.createOrUpdate(notes[1]);
        const numberOfSet2 = set.callCount;
        expect(numberOfSet2 === 2 * numberOfSet1).toBe(true);
    });
});
