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
        ({
            asset,
        } = await GraphNodeService.query(`
            asset(id: "${address}") {
                address
                linkedTokenAddress
            }
        `));

        if (!asset) {
            throw argsError('asset.notFound.onChain', {
                messageOptions: {
                    asset: address,
                },
            });
        }

        const {
            linkedTokenAddress,
        } = asset;

        assetModel.set(
            {
                address,
                balance: 0,
                linkedTokenAddress,
            },
            {
                // asset might have been created in SyncService
                ignoreDuplicate: true,
            },
        );
    }

    return asset;
}
