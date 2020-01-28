import {
    getDB,
} from '../..';


export default async function bulkGet(modelName, { networkId }, primaryKeys) {
    return getDB(networkId)[modelName].bulkGet(primaryKeys);
}
