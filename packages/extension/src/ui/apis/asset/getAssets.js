import {
    get,
} from '~/utils/storage';
import assetModel from '~/background/database/models/asset';

export default async function getAssets() {
    const networkId = await get('networkId');
    const rawAssets = await assetModel.query({ networkId })
        .toArray();

    return rawAssets.map(({
        registryAddress,
        linkedTokenAddress,
    }) => ({
        address: registryAddress,
        linkedTokenAddress,
    }));
}
