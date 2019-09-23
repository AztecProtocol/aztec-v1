import {
    getDB,
} from '../..';

export default async function latest(modelName, { networkId }, { orderBy, filterOptions }) {
    const table = getDB(networkId)[modelName];
    const keys = Object.keys(filterOptions);

    if (keys.length > 0) {
        const collection = await keys.reduce((acum, key) => acum.where(key)
            .equalsIgnoreCase(filterOptions[key]), table).sortBy(orderBy);

        return collection[collection.length - 1];
    }

    return table.orderBy(orderBy).last();
}
