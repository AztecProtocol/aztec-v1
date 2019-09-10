import {
    getDB,
} from '../../';


export default async function get(modelName, primaryKeyValue, { networkId }) {
    return await getDB(networkId)[modelName].get(primaryKeyValue);
}