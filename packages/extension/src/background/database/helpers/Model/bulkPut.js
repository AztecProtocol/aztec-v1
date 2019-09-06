import db from '../../'


export default async function bulkPut(modelName, items) {
    return db[modelName].bulkPut(items);
}