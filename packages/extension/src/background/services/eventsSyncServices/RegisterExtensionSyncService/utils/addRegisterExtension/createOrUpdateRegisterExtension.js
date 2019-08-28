import registerExtensionModel from '~background/database/models/registerExtension';

export default async function createOrUpdateRegisterExtension(rawRegisterExtension) {
    
    const existingRecord = await registerExtensionModel.get({address: rawRegisterExtension.address});
    let id;
    
    if(!existingRecord) {
        id = await registerExtensionModel.add(rawRegisterExtension);
    
    } else if(existingRecord.linkedPublicKey !== rawRegisterExtension.linkedPublicKey 
        && existingRecord.blockNumber !== rawRegisterExtension.blockNumber) {

        id = existingRecord.id;
        registerExtensionModel.update(id, rawRegisterExtension);    
    }

    return {
        id
    }
}