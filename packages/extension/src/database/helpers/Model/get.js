import * as storage from '~utils/storage';
import {
    errorLog,
} from '~utils/log';
import transformDataFromDb from '~database/utils/transformDataFromDb';

const getById = async (id) => {
    const key = await storage.get(id);
    if (!key) {
        return null;
    }
    if (typeof key === 'object') {
        return key;
    }

    return storage.get(key);
};

export default async function get(params) {
    const {
        key,
        id,
    } = params;
    const {
        name,
        dataKeyPattern,
        fields,
    } = this.config;
    const subFieldsDataKey = !Array.isArray(fields)
        ? fields.key
        : '';
    const subFieldsKey = subFieldsDataKey
        ? params[subFieldsDataKey]
        : '';

    let storageData;
    if (subFieldsDataKey && !dataKeyPattern) {
        storageData = await storage.get(name);
    } else if (key) {
        storageData = await storage.get(key);
    } else if (id) {
        storageData = await getById(id);
    } else {
        errorLog(`'key' or 'id' must be presented in the parameters of ${name}Model.get()`);
        return {};
    }

    if (subFieldsKey) {
        return transformDataFromDb(fields.fields, storageData[subFieldsKey]);
    }

    if (subFieldsDataKey) {
        const allData = {};
        Object.keys(storageData).forEach((subField) => {
            allData[subField] = transformDataFromDb(fields.fields, storageData[subField]);
        });
        return allData;
    }

    return transformDataFromDb(fields, storageData);
}
