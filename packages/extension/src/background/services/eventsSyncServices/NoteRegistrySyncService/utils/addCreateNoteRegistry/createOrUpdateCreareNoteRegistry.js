import createNoteRegistryModel from '~background/database/models/createNoteRegistry';

export default async function createOrUpdateCreareNoteRegistry(createNoteRegistry) {
    
    const existingRecord = await createNoteRegistryModel.get({registryOwner: createNoteRegistry.registryOwner});

    let id;
    if(existingRecord) {
        id = existingRecord.id;
        createNoteRegistryModel.update(id, createNoteRegistry);
    } else {
        id = await createNoteRegistryModel.add(createNoteRegistry);
    }

    return {
        id
    }
}