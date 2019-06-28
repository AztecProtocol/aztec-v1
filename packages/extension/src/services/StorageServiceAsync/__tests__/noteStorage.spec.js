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
        await noteStorage.createOrUpdate(notes[0]);
        expect(set.callCount).toBe(2);
        expect(set.args[0]).toEqual([{
            [notes[0].id]: 'n:0',
            noteCount: 1,
        }]);
        expect(set.args[1]).toEqual([{
            [`${notes[0].assetKey}v:${value}`]: ['n:0'],
        }]);
    });

    it('increase count when adding different notes to storage', async () => {
        await noteStorage.createOrUpdate(notes[0]);
        expect(set.callCount).toBe(2);
        expect(set.args[0]).toEqual([{
            [notes[0].id]: 'n:0',
            noteCount: 1,
        }]);
        expect(set.args[1]).toEqual([{
            [`${notes[0].assetKey}v:${value}`]: ['n:0'],
        }]);

        await noteStorage.createOrUpdate(notes[1]);
        expect(set.callCount).toBe(4);
        expect(set.args[2]).toEqual([{
            [notes[1].id]: 'n:1',
            noteCount: 2,
        }]);
        expect(set.args[3]).toEqual([{
            [`${notes[1].assetKey}v:${value}`]: ['n:1'],
        }]);
    });

    it('push note keys to existing assetValue array when adding notes with the same asset', async () => {
        await noteStorage.createOrUpdate(notes[1]);
        expect(set.callCount).toBe(2);
        expect(set.args[1]).toEqual([{
            [`${notes[1].assetKey}v:${value}`]: ['n:0'],
        }]);

        await noteStorage.createOrUpdate(notes[2]);
        expect(set.callCount).toBe(4);
        expect(set.args[3]).toEqual([{
            [`${notes[2].assetKey}v:${value}`]: ['n:0', 'n:1'],
        }]);
    });

    it('will not call set when adding existing note to storage', async () => {
        await noteStorage.createOrUpdate(notes[0]);
        expect(set.callCount).toBe(2);

        await noteStorage.createOrUpdate(notes[0]);
        expect(set.callCount).toBe(2);
    });
});
