import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';
import transformDataForDb from '~database/utils/transformDataForDb';

export default async function setData(
    data,
    {
        name,
        fields,
        forceUpdate = false,
        ignoreDuplicate = false,
    } = {},
) {
    const {
        key,
        id,
    } = data;

    if (!key) {
        return errorAction(`'key' must be presented to save '${name}' data`);
    }

    return lock(
        key,
        async () => {
            const existingData = await get(key);
            if (existingData) {
                if (ignoreDuplicate) {
                    return {
                        data: {
                            [key]: existingData,
                        },
                        modified: [],
                    };
                }
                if (!forceUpdate) {
                    const info = id ? `id "${id}"` : `key "${key}"`;
                    return errorAction(`Model '${name}' with ${info} already exists.`);
                }
            }

            let toSave = {};
            fields.forEach((field) => {
                if (field in data) {
                    toSave[field] = data[field];
                }
            });
            toSave = transformDataForDb(fields, toSave);

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
