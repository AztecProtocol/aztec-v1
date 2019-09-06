import db from '../../'

export default async function add(modelName, item) {
    const id = await db[modelName].add(item);
    
    return {
        id
    }
}