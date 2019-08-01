import {
    spy,
} from 'sinon';
import * as storage from '~utils/storage';
import createOrUpdateAsset from '../addNote/createOrUpdateAsset';

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
            address: '0xabc',
            linkedTokenAddress: '0x123',
            scalingFactor: 1,
            canAdjustSupply: false,
            canConvert: true,
        },
        {
            address: '0xdef',
            linkedTokenAddress: '0x456',
            scalingFactor: 10,
            canAdjustSupply: false,
            canConvert: true,
        },
    ];

    it('set asset to storage', async () => {
        const asset = assets[0];

        const dataBefore = await storage.get([
            'assetCount',
            asset.address,
            'a:0',
        ]);
        expect(dataBefore).toEqual({});

        await createOrUpdateAsset(asset);

        const dataAfter = await storage.get([
            'assetCount',
            asset.address,
            'a:0',
        ]);
        expect(dataAfter).toEqual({
            assetCount: 1,
            [asset.address]: 'a:0',
            'a:0': [
                asset.address,
                asset.linkedTokenAddress,
                1,
                false,
                true,
            ],
        });
    });

    it('increase count only when adding different assets to storage', async () => {
        await createOrUpdateAsset(assets[0]);
        const data0 = await storage.get(['assetCount']);
        expect(data0).toEqual({
            assetCount: 1,
        });

        await createOrUpdateAsset(assets[0]);
        const data1 = await storage.get(['assetCount']);
        expect(data1).toEqual({
            assetCount: 1,
        });

        await createOrUpdateAsset(assets[1]);
        const data2 = await storage.get(['assetCount']);
        expect(data2).toEqual({
            assetCount: 2,
        });
    });

    it('will not call set when adding existing asset to storage', async () => {
        await createOrUpdateAsset(assets[0]);
        const numberOfSet0 = set.callCount;
        expect(numberOfSet0 > 0).toBe(true);

        await createOrUpdateAsset(assets[0]);
        const numberOfSet1 = set.callCount;
        expect(numberOfSet1 === numberOfSet0).toBe(true);

        await createOrUpdateAsset(assets[1]);
        const numberOfSet2 = set.callCount;
        expect(numberOfSet2 === 2 * numberOfSet1).toBe(true);
    });
});
