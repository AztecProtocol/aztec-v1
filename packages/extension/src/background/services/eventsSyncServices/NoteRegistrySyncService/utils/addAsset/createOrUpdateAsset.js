import Asset from '~background/database/models/asset';

export default async function createOrUpdateAsset(createNoteRegistry) {
    
    const existingRecord = await Asset.get({registryOwner: createNoteRegistry.registryOwner});

    let id;
    if(existingRecord) {
        id = existingRecord.id;
        Asset.update(id, createNoteRegistry);
    } else {
        id = await Asset.add(createNoteRegistry);
    }

    return {
        id
    }
}