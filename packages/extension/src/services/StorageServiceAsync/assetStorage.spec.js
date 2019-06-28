/* global jest, expect */
import {
    spy,
} from 'sinon';
import chrome from 'sinon-chrome';
import * as storage from '~utils/storage';
import assetStorage from './assetStorage';

jest.mock('~utils/storage');

describe('AssetStorage', () => {
    let set;

    beforeEach(() => {
        global.chrome = chrome;
        set = spy(storage, 'set');
    });

    afterEach(() => {
        set.restore();
        storage.reset();
    });

    const asset = {
        id: '123',
        address: '0xabc',
    };

    it('will set asset to storage', async () => {
        await assetStorage.createOrUpdate(asset);
        expect(set.callCount).toBe(1);
        expect(set.args[0]).toEqual([{
            [asset.id]: 'a:0',
            assetCount: 1,
        }]);
    });
});
