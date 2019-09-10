import {
    getDB,
} from '../../';

export default async function add(modelName, item, { networkId }) {
    const id = await getDB(networkId)[modelName].add(item);
    
    return {
        id
    }
}