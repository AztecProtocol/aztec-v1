import Asset from '~/background/database/models/asset';


export default async function createBulkAssets(assets, networkId) {
    return Asset.bulkAdd(assets, { networkId });
}
