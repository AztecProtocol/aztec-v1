import {
    get,
    set,
    lock,
} from '~utils/storage';
import dataKey from '~utils/dataKey';
import errorAction from '~database/utils/errorAction';

export default async function setNoteIdKeyMapping(
    id,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
        autoIncrementBy = 'noteCount',
    },
) {
    return lock(
        [
            autoIncrementBy,
            id,
        ],
        async () => {
            let key = await get(id);
            if (key) {
                if (ignoreDuplicate) {
                    return {
                        data: {
                            [id]: key,
                        },
                        modified: [],
                    };
                }
                if (!forceUpdate) {
                    return errorAction(`Note with id "${id}" is already defined.`);
                }
            }

            const count = await get(autoIncrementBy) || 0;
            key = dataKey('note', {
                count,
            });

            await set({
                [id]: key,
                [autoIncrementBy]: count + 1,
            });

            return {
                data: {
                    [id]: key,
                    [autoIncrementBy]: count + 1,
                },
                modified: [
                    id,
                    autoIncrementBy,
                ],
            };
        },
    );
}
