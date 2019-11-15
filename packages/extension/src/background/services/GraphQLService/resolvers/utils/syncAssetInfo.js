import assetModel from '~database/models/asset';
import EventService from '~background/services/EventService';
import {
    argsError,
} from '~utils/error';

// TODO: pass ctx where you call this function
export default async function syncAssetInfo(args, ctx = {}) {
    const {
        id: address,
    } = args;

    const {
        // TODO: remove default value, when it will be passed here.
        networkId = 0,
    } = ctx;

    if (!address) {
        return null;
    }

    let asset = await assetModel.get({
        address,
    });

    if (!asset) {
        const {
            error,
            asset: fetchedAsset,
        } = await EventService.fetchAsset({
            address,
            networkId,
        });

        const onChainAsset = {
            address: fetchedAsset.registryOwner,
            linkedTokenAddress: fetchedAsset.linkedTokenAddress,
            scalingFactor: fetchedAsset.scalingFactor,
            canAdjustSupply: fetchedAsset.canAdjustSupply,
            canConvert: fetchedAsset.canConvert,
        };

        if (!onChainAsset) {
            throw argsError('asset.notFound.onChain', {
                messageOptions: {
                    asset: address,
                },
            });
        }

        await assetModel.set(
            {
                ...onChainAsset,
                scalingFactor: +(onChainAsset.scalingFactor || 0),
                address,
            },
            {
                // asset might have been created in SyncService
                ignoreDuplicate: true,
            },
        );

        asset = await assetModel.get({
            address,
        });
    }

    return asset;
}
