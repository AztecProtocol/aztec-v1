import Asset from '~background/database/models/asset';

export default async function createOrUpdateAsset(asset) {
    
    const existingRecord = await Asset.get({registryOwner: asset.registryOwner});

    let id;
    if(existingRecord) {
        id = existingRecord.id;
        Asset.update(id, asset);
    } else {
        id = await Asset.add(asset);
    }

    return {
        id
    }
}