import dataKey from '~utils/dataKey';
import {
    get as storageGet,
} from '~utils/storage';
import {
    errorLog,
} from '~utils/log';

const normalLoop = async (get, cb) => {
    const data = await get();
    if (!data) return;

    Object.keys(data).forEach((id) => {
        const entry = {
            ...data[id],
            id,
        };
        cb(entry);
    });
};

const mapLoog = async (get, config, cb) => {
    const {
        autoIncrementBy,
        dataKeyPattern,
    } = config;

    const total = await storageGet(autoIncrementBy);
    if (!total) return;

    for (let count = 0; count < total; count += 1) {
        const key = dataKey(dataKeyPattern, { count });
        /* eslint-disable no-await-in-loop */
        const data = await get({
            key,
        });
        /* eslint-enable no-await-in-loop */

        cb({
            ...data,
            key,
        });
    }
};

export default async function each(cb) {
    const {
        name,
        autoIncrementBy,
        dataKeyPattern,
    } = this.config;

    if (!autoIncrementBy) {
        await normalLoop(this.get, cb);
    } else {
        const keyVars = dataKeyPattern.match(/{[a-z]+}/g);
        if (keyVars.some(keyVar => keyVar !== '{count}')) {
            errorLog(`Cannot loop through '${name}' model with dataKeyPattern = ${dataKeyPattern}`);
            return;
        }
        await mapLoog(this.get, this.config, cb);
    }
}
