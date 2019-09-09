import Asset from '~background/database/models/asset';


export default async function createBulkAssets(assets) {
    return Asset.bulkAdd(assets);
}