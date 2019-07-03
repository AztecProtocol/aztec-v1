import * as storage from '~utils/storage';
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

export default async function get({
    id,
    key,
} = {}) {
    let data = null;
    if (key) {
        data = await storage.get(key);
    } else if (id) {
        data = await getById(id);
    }

    const {
        fields,
    } = this.config;

    return transformDataFromDb(fields, data);
}
