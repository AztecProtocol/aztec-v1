import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';

export default async function update(data) {
    const {
        id,
    } = data;
    let {
        key,
    } = data;
    const {
        name,
        fields,
    } = this.config;

    if (!id && !key) {
        return errorAction(`'id' or 'key' must be presented to update '${name}'.`);
    }

    if (!key) {
        key = await get(id);
        if (!key) {
            return errorAction(`Model '${name}' with id "${id}" does not exist.`);
        }
    }

    return lock(
        key,
        async () => {
            const prevData = await get(key) || {};
            const newData = {
                ...prevData,
            };
            fields
                .filter(field => data[field] !== undefined)
                .forEach((field) => {
                    const val = data[field];
                    newData[field] = typeof val === 'function'
                        ? val(prevData[field])
                        : val;
                });

            await set({
                [key]: newData,
            });

            return {
                data: {
                    [key]: newData,
                },
                modified: [key],
            };
        },
    );
}
