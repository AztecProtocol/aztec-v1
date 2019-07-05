import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';
import transformDataForDb from '~database/utils/transformDataForDb';
import transformDataFromDb from '~database/utils/transformDataFromDb';

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
            let storageData = await get(key);
            let ignored = false;

            if (storageData) {
                if (ignoreDuplicate) {
                    ignored = true;
                } else if (!forceUpdate) {
                    const info = id ? `id "${id}"` : `key "${key}"`;
                    return errorAction(`Model '${name}' with ${info} already exists.`);
                }
            }

            let modified = [];
            if (!ignored) {
                storageData = transformDataForDb(fields, data);
                await set({
                    [key]: storageData,
                });
                modified = [key];
            }

            return {
                data: {
                    [key]: transformDataFromDb(fields, storageData),
                },
                storage: {
                    [key]: storageData,
                },
                modified,
            };
        },
    );
}
