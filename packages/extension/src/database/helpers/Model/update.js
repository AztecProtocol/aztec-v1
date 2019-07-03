import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';
import transformDataFromDb from '~database/utils/transformDataFromDb';
import transformDataForDb from '~database/utils/transformDataForDb';

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
                ...transformDataFromDb(fields, prevData),
            };
            fields
                .filter(field => data[field] !== undefined)
                .forEach((field) => {
                    const val = data[field];
                    newData[field] = typeof val === 'function'
                        ? val(newData[field])
                        : val;
                });
            const toSave = transformDataForDb(fields, newData);

            await set({
                [key]: toSave,
            });

            return {
                data: {
                    [key]: toSave,
                },
                modified: [key],
            };
        },
    );
}
