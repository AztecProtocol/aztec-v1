import db from '../../'

export default async function get(modelName, primaryKeyValue) {
    return await db[modelName].get(primaryKeyValue);
}