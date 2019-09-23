import {
    getDB,
} from '../..';


export default async function get(modelName, { networkId }, primaryKeyValue) {
    return getDB(networkId)[modelName].get(primaryKeyValue);
}
