import ZkAsset from './ZkAsset';

export default async function assetFactory(assetId) {
    const asset = new ZkAsset({
        id: assetId,
    });
    await asset.init();

    return asset;
}
