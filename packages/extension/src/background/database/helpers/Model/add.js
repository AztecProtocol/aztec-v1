import db from '../../'

export default async function add(modelName, params = {}) {
    const id = await db[modelName].put(params);
    
    return {
        id
    }
}