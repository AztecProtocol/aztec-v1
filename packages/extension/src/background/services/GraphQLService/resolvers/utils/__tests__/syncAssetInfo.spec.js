import expectErrorResponse from '~helpers/expectErrorResponse';
import * as storage from '~utils/storage';
import GraphNodeService from '~background/services/GraphNodeService';
import assetModel from '~database/models/asset';
import syncAssetInfo from '../syncAssetInfo';
import storyOf from './helpers/stories';

jest.mock('~utils/storage');

beforeEach(() => {
    storage.reset();
});

describe('syncAssetInfo', () => {
    const assetData = {
        address: 'asset_address',
        linkedTokenAddress: 'linked_token_address',
        scalingFactor: 5,
        canAdjustSupply: true,
        canConvert: false,
    };

    const querySpy = jest.spyOn(GraphNodeService, 'query')
        .mockImplementation(() => ({
            onChainAsset: assetData,
        }));

    beforeEach(() => {
        querySpy.mockClear();
    });

    it('return existing asset data in storage', async () => {
        await assetModel.set(assetData);

        const response = await storyOf('ensureDomainPermission', syncAssetInfo, {
            id: assetData.address,
        });

        const asset = await assetModel.get({
            id: assetData.address,
        });
        expect(response).toEqual(asset);

        expect(querySpy).not.toHaveBeenCalled();
    });

    it('return null if id is empty in args', async () => {
        await assetModel.set(assetData);

        const response = await storyOf('ensureDomainPermission', syncAssetInfo, {
            id: '',
        });
        expect(response).toEqual(null);

        expect(querySpy).not.toHaveBeenCalled();
    });

    it('sync asset from blockchain if not found in storage', async () => {
        const emptyAsset = await assetModel.get({
            id: assetData.address,
        });
        expect(emptyAsset).toEqual(null);

        const response = await storyOf('ensureDomainPermission', syncAssetInfo, {
            id: assetData.address,
        });

        const asset = await assetModel.get({
            id: assetData.address,
        });
        expect(asset).not.toBe(null);
        expect(response).toEqual(asset);

        expect(querySpy).toHaveBeenCalledTimes(1);
    });

    it('throw error if asset is not found in storage and on chain', async () => {
        querySpy.mockImplementationOnce(() => ({
            onChainAsset: null,
        }));

        await expectErrorResponse(async () => storyOf(
            'ensureDomainPermission',
            syncAssetInfo,
            {
                id: assetData.address,
            },
        )).toBe('asset.notFound.onChain');

        const asset = await assetModel.get({
            id: assetData.address,
        });
        expect(asset).toBe(null);

        expect(querySpy).toHaveBeenCalledTimes(1);
    });
});
