import db from '../../'


export default async function bulkAdd(modelName, items) {
    return db[modelName].bulkAdd(items);
}