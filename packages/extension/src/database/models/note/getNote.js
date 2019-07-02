import {
    get,
} from '~utils/storage';

const getNoteById = async (id) => {
    const key = await get(id);
    if (!key) {
        return null;
    }

    return get(key);
};

export default async function getNote({
    id,
    key,
} = {}) {
    if (key) {
        return get(key);
    }
    if (id) {
        return getNoteById(id);
    }

    return null;
}
