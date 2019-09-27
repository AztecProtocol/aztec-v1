import {
    getDB,
} from '../..';

/*
* If the operation succeeds then the returned Promise resolves to the key under which the object was stored in the Table
*/
export default async function put(modelName, item, { networkId }) {
    return getDB(networkId)[modelName].put(item);
}
