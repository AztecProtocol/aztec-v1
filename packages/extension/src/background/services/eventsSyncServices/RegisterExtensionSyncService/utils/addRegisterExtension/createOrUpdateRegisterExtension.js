import registerExtensionModel from '~background/database/models/registerExtension';

export default async function createOrUpdateRegisterExtension(registerExtension) {
    
    const existingEvents = await registerExtensionModel.query(({address}) => address===registerExtension.address);
    let id;
    
    if(existingEvents.length) {
        const existingEvent = existingEvents[0];
        id = existingEvent.id;
        registerExtensionModel.update(id, registerExtension);
    } else {
        id = await registerExtensionModel.add(registerExtension);
    }

    return {
        id
    }
}