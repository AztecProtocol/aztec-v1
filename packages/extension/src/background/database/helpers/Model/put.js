import db from '../../'

/*
* If the operation succeeds then the returned Promise resolves to the key under which the object was stored in the Table
*/
export default async function put(modelName, params = {}) {
    return db[modelName].put(params);
}