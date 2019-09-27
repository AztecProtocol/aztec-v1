import {
    getDB,
} from '../..';


export default async function bulkAdd(modelName, items, { networkId }) {
    return getDB(networkId)[modelName].bulkAdd(items);
}
