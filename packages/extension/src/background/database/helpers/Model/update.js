import db from '../../'

export default async function update(modelName, id, params = {}) {
    await db[modelName].update(id, params);
}