import createNoteRegistryModel from '~background/database/models/createNoteRegistry';

export default async function createOrUpdateCreareNoteRegistry(createNoteRegistry) {
    
    const existingEvents = await createNoteRegistryModel
        .query(({registryOwner}) => registryOwner === createNoteRegistry.registryOwner);
    
    let id;
    if(existingEvents.length) {
        const existingEvent = existingEvents[0];
        id = existingEvent.id;
        createNoteRegistryModel.update(id, createNoteRegistry);
    } else {
        id = await createNoteRegistryModel.add(createNoteRegistry);
    }

    return {
        id
    }
}