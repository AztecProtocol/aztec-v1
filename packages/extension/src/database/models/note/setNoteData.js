import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';

export default async function setNoteData(
    note,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
    },
) {
    const {
        key,
        id,
        ...data
    } = note;

    if (!key) {
        return errorAction("'key' must be presented to save note data");
    }

    return lock(
        key,
        async () => {
            const existingNote = await get(key);
            if (existingNote) {
                if (ignoreDuplicate) {
                    return {
                        data: {
                            [key]: existingNote,
                        },
                        modified: [],
                    };
                }
                if (!forceUpdate) {
                    const info = id ? `id "${id}"` : `key "${key}"`;
                    return errorAction(`Note with ${info} already exists.`);
                }
            }

            // TODO - validate data
            await set({
                [key]: data,
            });

            return {
                data: {
                    [key]: data,
                },
                modified: [key],
            };
        },
    );
}
