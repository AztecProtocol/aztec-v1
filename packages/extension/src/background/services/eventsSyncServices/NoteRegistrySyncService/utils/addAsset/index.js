import createOrUpdateAsset from './createOrUpdateAsset';

export default async function addAsset(asset) {
    return createOrUpdateAsset(asset);
}
