import Asset from '~/background/database/models/asset';


export default async function syncedAssets(networkId) {
    return Asset.query({ networkId }).toArray();
}
