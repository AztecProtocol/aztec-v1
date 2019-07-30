import assetModel from '~database/models/asset';
import GraphNodeService from '~backgroundServices/GraphNodeService';
import {
    argsError,
} from '~utils/error';

export default async function syncAssetInfo(address) {
    let asset = await assetModel.get({
        address,
    });

    if (!asset) {
        const {
            onChainAsset,
        } = await GraphNodeService.query(`
            onChainAsset: asset(id: "${address}") {
                address
                linkedTokenAddress
                scalingFactor
                canAdjustSupply
                canConvert
            }
        `);

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
                balance: 0,
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
