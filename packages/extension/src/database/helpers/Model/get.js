import * as storage from '~utils/storage';

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
    if (key) {
        return storage.get(key);
    }
    if (id) {
        return getById(id);
    }

    return null;
}
