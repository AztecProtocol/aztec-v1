import dataKey, {
    getPrefix,
} from '~/utils/dataKey';
import {
    get as storageGet,
} from '~/utils/storage';
import {
    errorLog,
} from '~/utils/log';
import asyncForEach from '~/utils/asyncForEach';

const normalLoop = async (get, cb, where) => {
    const data = await get();
    if (!data) return;

    const {
        idGt,
    } = where || {};

    await asyncForEach(Object.keys(data), async (id) => {
        if (idGt && id <= idGt) return;

        const entry = {
            ...data[id],
            id,
        };
        await cb(entry);
    });
};

const mapLoog = async (get, config, cb, where) => {
    const {
        autoIncrementBy,
        dataKeyPattern,
    } = config;

    const total = await storageGet(autoIncrementBy);
    if (!total) return;

    const {
        idGt,
    } = where || {};
    let minCount = 0;
    if (idGt) {
        const keyPrefix = getPrefix(dataKeyPattern);
        const count = idGt.replace(new RegExp(`^${keyPrefix}`), '');
        minCount = parseInt(count, 10) + 1;
    }

    for (let count = minCount; count < total; count += 1) {
        const key = dataKey(dataKeyPattern, { count });
        /* eslint-disable no-await-in-loop */
        const data = await get({
            key,
        });

        await cb({
            ...data,
            key,
        });
        /* eslint-enable no-await-in-loop */
    }
};

export default async function each(cb, where = null) {
    const {
        name,
        autoIncrementBy,
        dataKeyPattern,
    } = this.config;

    if (!autoIncrementBy) {
        await normalLoop(this.get, cb, where);
    } else {
        const keyVars = dataKeyPattern.match(/{[a-z]+}/g);
        if (keyVars.some(keyVar => keyVar !== '{count}')) {
            errorLog(`Cannot loop through '${name}' model with dataKeyPattern = ${dataKeyPattern}`);
            return;
        }
        await mapLoog(this.get, this.config, cb, where);
    }
}
