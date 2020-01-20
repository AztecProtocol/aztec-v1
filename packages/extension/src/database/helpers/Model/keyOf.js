import {
    warnLog,
} from '~/utils/log';
import {
    get,
} from '~/utils/storage';

export default async function keyOf(params = {}) {
    const {
        name,
        index,
        autoIncrementBy,
    } = this.config;
    if (!autoIncrementBy) {
        warnLog(`Cannot get key from model '${name}'.`);
        return '';
    }

    let id;
    if (typeof params === 'string') {
        id = params;
    } else {
        ({
            id,
        } = params);
        if (!id
            && index
        ) {
            id = params[index];
        }
    }
    if (!id) {
        const requiredKeys = ['id'];
        if (index) {
            requiredKeys.push(index);
        }
        const requiredKeysStr = requiredKeys.map(k => `'${k}'`)
            .join(' or ');
        warnLog(`${requiredKeysStr} must be provided to get the key.`);
        return '';
    }

    const key = await get(id);

    return key || '';
}
