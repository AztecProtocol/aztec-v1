import BN from 'bn.js';
import {
    get,
} from '~/utils/storage';
import assetModel from '~/background/database/models/asset';

export default async function getDomainAssets() {
    // TODO - domain should not be able to access all assets by default
    const networkId = await get('networkId');
    const rawAssets = await assetModel.query({ networkId })
        .toArray();

    return rawAssets.map(({
        registryAddress,
        linkedTokenAddress,
        scalingFactor,
    }) => ({
        address: registryAddress,
        linkedTokenAddress,
        scalingFactor: new BN(scalingFactor),
    }));
}
