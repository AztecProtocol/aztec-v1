import {
    get,
    set,
    lock,
} from '~/utils/storage';
import dataKey from '~/utils/dataKey';
import errorAction from '~/database/utils/errorAction';

export default async function setIdKeyMapping(
    data,
    {
        id,
        name,
        autoIncrementBy,
        dataKeyPattern,
        forceReplace = false,
        ignoreDuplicate = false,
    } = {},
) {
    return lock(
        [
            autoIncrementBy,
            id,
        ],
        async () => {
            let key = await get(id);
            let count = await get(autoIncrementBy) || 0;
            let ignored = false;

            if (key) {
                if (ignoreDuplicate) {
                    ignored = true;
                } else if (!forceReplace) {
                    return errorAction(`Model '${name}' with id "${id}" is already defined.`);
                }
            } else {
                if (dataKeyPattern) {
                    key = dataKey(dataKeyPattern, {
                        ...data,
                        count,
                    });
                } else {
                    key = dataKey(name, {
                        ...data,
                        count,
                    });
                }
                if (!key) {
                    key = `${name}:${count}`;
                }
            }

            let existingData;
            let modified = [];

            if (!ignored) {
                existingData = await get(key);

                if (!existingData) {
                    count += 1;
                } else if (ignoreDuplicate) {
                    ignored = true;
                } else if (!forceReplace) {
                    return errorAction(`Model '${name}' with key "${key}" is already defined.`);
                }
            }

            if (!ignored) {
                await set({
                    [id]: key,
                    [autoIncrementBy]: count,
                });
                modified = [
                    id,
                    autoIncrementBy,
                ];
            }

            return {
                data: {
                    [id]: key,
                    [autoIncrementBy]: count,
                },
                storage: {
                    [id]: key,
                    [autoIncrementBy]: count,
                },
                modified,
            };
        },
    );
}
