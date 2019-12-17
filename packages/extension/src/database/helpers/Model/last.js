import dataKey, {
    getPrefix,
} from '~/utils/dataKey';
import {
    get as storageGet,
} from '~/utils/storage';
import {
    errorLog,
} from '~/utils/log';

const meetConditions = (entry, conditions) => Object.keys(conditions)
    .every(field => entry[field] === conditions[field]);

const findLastInArr = async (get, where) => {
    const data = await get();
    if (!data) {
        return null;
    }

    const {
        idLt,
        ...conditions
    } = where || {};

    const ids = Object.keys(data).reverse();
    const lastId = ids.find((id) => {
        if (idLt && id >= idLt) {
            return false;
        }
        return meetConditions(data[id], conditions);
    });

    if (!lastId) {
        return null;
    }

    return {
        ...data[lastId],
        id: lastId,
    };
};

const getCountFromKey = (dataKeyPattern, key) => {
    const keyPrefix = getPrefix(dataKeyPattern);
    return key.replace(new RegExp(`^${keyPrefix}`), '');
};

const findLastInMapping = async (get, config, where) => {
    const {
        autoIncrementBy,
        dataKeyPattern,
    } = config;

    const total = await storageGet(autoIncrementBy);
    if (!total) {
        return null;
    }

    const {
        idLt,
        keyLt,
        ...conditions
    } = where || {};
    let maxCount = total;
    if (idLt) {
        const key = await storageGet(idLt);
        const count = getCountFromKey(dataKeyPattern, key);
        maxCount = Math.min(
            maxCount,
            parseInt(count, 10) - 1,
        );
    }
    if (keyLt) {
        const count = getCountFromKey(dataKeyPattern, keyLt);
        maxCount = Math.min(
            maxCount,
            parseInt(count, 10) - 1,
        );
    }

    for (let count = maxCount; count >= 0; count -= 1) {
        const key = dataKey(dataKeyPattern, { count });
        /* eslint-disable no-await-in-loop */
        const data = await get({
            key,
        });
        /* eslint-enable no-await-in-loop */

        if (data
            && meetConditions(data, conditions)
        ) {
            return {
                ...data,
                key,
            };
        }
    }

    return null;
};

export default async function last(where = null) {
    const {
        name,
        autoIncrementBy,
        dataKeyPattern,
    } = this.config;

    if (!autoIncrementBy) {
        return findLastInArr(this.get, where);
    }

    const keyVars = dataKeyPattern.match(/{[a-z]+}/g);
    if (keyVars.some(keyVar => keyVar !== '{count}')) {
        errorLog(`Cannot find the last entry for '${name}' model with dataKeyPattern = ${dataKeyPattern}`);
        return null;
    }

    return findLastInMapping(this.get, this.config, where);
}
