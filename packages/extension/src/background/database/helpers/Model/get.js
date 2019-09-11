import {
    getDB,
} from '../../';


export default async function get(modelName, { networkId }, primaryKeyValue) {
    return await getDB(networkId)[modelName].get(primaryKeyValue);
}