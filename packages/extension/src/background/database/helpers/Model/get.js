import db from '../../'

export default async function get(modelName, params) {
    return await db[modelName].get(params);
}