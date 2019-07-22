import * as storage from '~utils/storage';
import {
    warnLog,
    errorLog,
} from '~utils/log';
import transformDataFromDb from '~database/utils/transformDataFromDb';

export default async function get(params = {}) {
    let {
        key,
        id,
    } = params;
    const {
        name,
        dataKeyPattern,
        fields,
        index,
    } = this.config;
    if (!id
        && index
    ) {
        id = params[index];
    }
    const subFieldsDataKey = !Array.isArray(fields)
        ? fields.key
        : '';
    const subFieldsKey = subFieldsDataKey
        ? params[subFieldsDataKey]
        : '';

    if (!dataKeyPattern && key) {
        warnLog(`Use id instead of key ("${key}") to get data from model '${name}.`);
        key = '';
    }

    let storageData;
    if (subFieldsDataKey && !dataKeyPattern) {
        storageData = await storage.get(name);
    } else if (key) {
        storageData = await storage.get(key);
    } else if (id) {
        if (!dataKeyPattern) {
            storageData = await storage.get(id);
        } else {
            key = await storage.get(id);

            if (typeof key === 'object') {
                warnLog(`id "${id}" doesn't map to a key in ${name} model.`);
                storageData = key;
                key = '';
            } else if (key) {
                storageData = await storage.get(key);
            }
        }
    } else {
        errorLog(`'key' or 'id' must be presented in the parameters of get() for ${name} model`);
        return null;
    }

    if (subFieldsDataKey && !subFieldsKey) {
        if (!storageData) {
            return null;
        }

        const allData = {};
        Object.keys(storageData).forEach((subField) => {
            const readableData = transformDataFromDb(fields.fields, storageData[subField]);
            allData[subField] = {
                id,
                [subFieldsDataKey]: subField,
                ...readableData,
            };
        });
        return allData;
    }

    if (subFieldsKey && !storageData) {
        warnLog(`Try to get data for '${subFieldsKey}' from undefined ${name} storage.`);
        return null;
    }

    const readableData = subFieldsKey
        ? transformDataFromDb(fields.fields, storageData[subFieldsKey])
        : transformDataFromDb(fields, storageData);

    if (readableData) {
        if (!id
            && readableData[index]
        ) {
            id = readableData[index];
        }
        if (id) {
            readableData.id = id;
        }

        if (subFieldsKey) {
            readableData[subFieldsDataKey] = subFieldsKey;
        }
    }

    return readableData || null;
}
