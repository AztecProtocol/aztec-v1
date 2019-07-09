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
    const {
        name,
        dataKeyPattern,
    } = this.config;
    let {
        key,
    } = data;
    let {
        fields,
    } = this.config;

    if (!dataKeyPattern) {
        key = id;
    } else if (!key && id) {
        key = await get(id);
    }

    let subFieldsKey;
    if (!Array.isArray(fields)) {
        if (!dataKeyPattern) {
            key = name;
        }
        const dataKey = fields.key;
        ({ fields } = fields);
        subFieldsKey = data[dataKey];
        if (!subFieldsKey) {
            return errorAction(`'${dataKey}' must be presented to update '${name}'.`);
        }
    }

    if (!id && !key) {
        const requiredKeys = ['id'];
        if (dataKeyPattern) {
            requiredKeys.push('key');
        }
        const requiredStr = requiredKeys
            .map(k => `'${k}'`)
            .join(' or ');
        return errorAction(`${requiredStr} must be presented to update '${name}'.`);
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
            const newData = transformDataFromDb(
                fields,
                !subFieldsKey ? prevData : prevData[subFieldsKey],
            ) || {};
            fields
                .filter(field => data[field] !== undefined)
                .forEach((field) => {
                    const val = data[field];
                    newData[field] = typeof val === 'function'
                        ? val(newData[field])
                        : val;
                });
            const toSave = !subFieldsKey
                ? transformDataForDb(fields, newData)
                : {
                    ...prevData,
                    [subFieldsKey]: transformDataForDb(fields, newData),
                };

            await set({
                [key]: toSave,
            });

            return {
                data: {
                    [key]: !subFieldsKey
                        ? newData
                        : {
                            [subFieldsKey]: newData,
                        },
                },
                storage: {
                    [key]: !subFieldsKey
                        ? toSave
                        : {
                            [subFieldsKey]: toSave[subFieldsKey],
                        },
                },
                modified: [key],
            };
        },
    );
}
