import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';
import fields, {
    readOnly,
} from './_fields';

export default async function updateNote(
    data,
) {
    const {
        id,
    } = data;
    let {
        key,
    } = data;

    if (!id && !key) {
        return errorAction("'id' or 'key' must be presented in note.");
    }

    if (!key) {
        key = await get(id);
        if (!key) {
            return errorAction(`Note with id "${id}" does not exist.`);
        }
    }

    return lock(
        key,
        async () => {
            const prevData = await get(key) || {};
            const note = {
                ...prevData,
            };
            fields
                .filter(field => readOnly.indexOf(field) < 0)
                .filter(field => data[field] !== undefined)
                .forEach((field) => {
                    const val = data[field];
                    note[field] = typeof val === 'function'
                        ? val(prevData[field])
                        : val;
                });

            await set({
                [key]: note,
            });

            return {
                data: {
                    [key]: note,
                },
                modified: [key],
            };
        },
    );
}
