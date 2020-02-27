import ConnectionService from '~/client/services/ConnectionService';
import ZkAsset from './ZkAsset';

export default async function assetFactory(assetId) {
    const { asset } = await ConnectionService.query(
        'asset',
        { id: assetId },
    ) || {};

    return new ZkAsset({
        ...asset,
        id: assetId,
    });
}
