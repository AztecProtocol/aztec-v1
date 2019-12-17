import {
    getDB,
} from '../..';

export default async function latest(modelName, { networkId }, { orderBy }) {
    const table = getDB(networkId)[modelName];
    return table.orderBy(orderBy).last();
}
