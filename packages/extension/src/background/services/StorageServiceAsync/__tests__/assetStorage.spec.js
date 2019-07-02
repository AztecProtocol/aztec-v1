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
        const dataBefore = await storage.get([
            'assetCount',
            assets[0].id,
            'a:0',
        ]);
        expect(dataBefore).toEqual({});

        await assetStorage.createOrUpdate(assets[0]);

        const dataAfter = await storage.get([
            'assetCount',
            assets[0].id,
            'a:0',
        ]);
        expect(dataAfter).toEqual({
            assetCount: 1,
            [assets[0].id]: 'a:0',
            'a:0': {
                balance: 0,
            },
        });
    });

    it('increase count when adding different assets to storage', async () => {
        await assetStorage.createOrUpdate(assets[0]);
        const data0 = await storage.get([
            'assetCount',
            assets[0].id,
        ]);
        expect(data0).toEqual({
            assetCount: 1,
            [assets[0].id]: 'a:0',
        });

        await assetStorage.createOrUpdate(assets[1]);
        const data1 = await storage.get([
            'assetCount',
            assets[1].id,
        ]);
        expect(data1).toEqual({
            assetCount: 2,
            [assets[1].id]: 'a:1',
        });
    });

    it('will not call set when adding existing asset to storage', async () => {
        await assetStorage.createOrUpdate(assets[0]);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);

        await assetStorage.createOrUpdate(assets[0]);
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 === numberOfSet0).toBe(true);

        await assetStorage.createOrUpdate(assets[1]);
        const numberOfSet2 = set.callCount;
        expect(numberOfSet2 === 2 * numberOfSet1).toBe(true);
    });
});
