import {
    errorLog,
} from '~/utils/log';
import {
    getDB,
} from '../..';

export default async function latest(
    modelName,
    { networkId },
    {
        orderBy,
        filterOptions,
    },
) {
    if (!orderBy) {
        errorLog(`Field 'orderBy' is required to get the latest ${modelName}.`);
        return null;
    }

    let matchingIds;
    if (Object.keys(filterOptions).length) {
        const query = getDB(networkId)[modelName].where(filterOptions);
        matchingIds = new Set(await query.primaryKeys());
        if (!matchingIds.size) {
            return null;
        }
    }

    const table = getDB(networkId)[modelName];
    let targetId;
    await table
        .orderBy(orderBy)
        .reverse()
        .until(() => !!targetId)
        .eachPrimaryKey(async (id) => {
            if (!matchingIds || matchingIds.has(id)) {
                targetId = id;
            }
        });

    return targetId ? table.get(targetId) : null;
}
