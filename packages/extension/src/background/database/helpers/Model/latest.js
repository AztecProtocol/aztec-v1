import {
    getDB,
} from '../..';

export default async function latest(modelName, { networkId }, { orderBy, filterOptions }) {
    const table = getDB(networkId)[modelName];

    // if (Object.keys(filterOptions).length > 0) {
    //     const collection = table.where(filterOptions).sortBy(orderBy);

    //     console.log({collection});
    // }

    return table.orderBy(orderBy).last();
}
