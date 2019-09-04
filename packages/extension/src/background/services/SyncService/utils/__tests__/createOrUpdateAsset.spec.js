import * as storage from '~utils/storage';
import createOrUpdateAsset from '../addNote/createOrUpdateAsset';

const setSpy = jest.spyOn(storage, 'set');

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
    setSpy.mockClear();
});

describe('createOrUpdateAsset', () => {
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
        expect(setSpy).toHaveBeenCalled();

        setSpy.mockClear();
        await createOrUpdateAsset(assets[0]);
        expect(setSpy).not.toHaveBeenCalled();

        setSpy.mockClear();
        await createOrUpdateAsset(assets[1]);
        expect(setSpy).toHaveBeenCalled();
    });
});
