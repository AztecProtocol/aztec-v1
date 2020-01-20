import {
    createBulkAssets,
} from '..';
import Asset from '~/background/database/models/asset';
import clearDB from '~/background/database/utils/clearDB';


describe('createBulkAssets', () => {
    const rawAssets = [
        {
            registryOwner: '0x21',
            registryAddress: '0x24',
            scalingFactor: 1,
            linkedTokenAddress: '0x25',
            canAdjustSupply: true,
            canConvert: false,
            blockNumber: 4,
        },
        {
            registryOwner: '0x02',
            registryAddress: '0x01',
            scalingFactor: 2,
            linkedTokenAddress: '0xff',
            canAdjustSupply: false,
            canConvert: true,
            blockNumber: 5,
        },
    ];

    afterEach(async () => {
        clearDB();
    });

    it('should insert two unique Assets with right fields', async () => {
        // given
        const assetsBefore = await Asset.query({ networkId: 0 }).toArray();
        expect(assetsBefore.length).toEqual(0);

        // action
        await createBulkAssets(rawAssets, 0);

        // expected
        const assetsAfter = await Asset.query({ networkId: 0 }).toArray();

        expect(assetsAfter.length).toEqual(rawAssets.length);
        expect(assetsAfter)
            .toMatchObject([...rawAssets].sort((a, b) => a.registryAddress - b.registryAddress));
    });
});
