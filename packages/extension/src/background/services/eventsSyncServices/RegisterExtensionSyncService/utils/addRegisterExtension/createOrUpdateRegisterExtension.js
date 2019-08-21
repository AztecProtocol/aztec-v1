import registerExtensionModel from '~background/database/models/registerExtension';

export default async function createOrUpdateRegisterExtension(registerExtension) {
    console.log("createOrUpdateRegisterExtension(registerExtension): " + JSON.stringify(registerExtension))

    const id = await registerExtensionModel.add(registerExtension);

    return {
        id
    }
}