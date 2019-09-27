import {
    getDB,
} from '../..';


export default async function bulkPut(modelName, items, { networkId }) {
    return getDB(networkId)[modelName].bulkPut(items);
}
