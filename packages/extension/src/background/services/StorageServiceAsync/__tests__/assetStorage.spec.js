import {
    spy,
} from 'sinon';
import * as storage from '~utils/storage';
import assetStorage from '../assetStorage';

jest.mock('~utils/storage');

describe('createOrUpdate', () => {
    let set;

    beforeEach(() => {
        set = spy(storage, 'set');
    });

    afterEach(() => {
        set.restore();
        storage.reset();
    });

    const assets = [
        {
            id: '123',
            address: '0xabc',
        },
        {
            id: '456',
            address: '0xdef',
        },
    ];

    it('set asset to storage', async () => {
        await assetStorage.createOrUpdate(assets[0]);
        expect(set.callCount).toBe(1);
        expect(set.args[0]).toEqual([{
            [assets[0].id]: 'a:0',
            assetCount: 1,
        }]);
    });

    it('increase count when adding different assets to storage', async () => {
        await assetStorage.createOrUpdate(assets[0]);
        expect(set.callCount).toBe(1);
        expect(set.args[0]).toEqual([{
            [assets[0].id]: 'a:0',
            assetCount: 1,
        }]);

        await assetStorage.createOrUpdate(assets[1]);
        expect(set.callCount).toBe(2);
        expect(set.args[1]).toEqual([{
            [assets[1].id]: 'a:1',
            assetCount: 2,
        }]);
    });

    it('will not call set when adding existing asset to storage', async () => {
        await assetStorage.createOrUpdate(assets[0]);
        expect(set.callCount).toBe(1);
        expect(set.args[0]).toEqual([{
            [assets[0].id]: 'a:0',
            assetCount: 1,
        }]);

        await assetStorage.createOrUpdate(assets[0]);
        expect(set.callCount).toBe(1);
    });
});
