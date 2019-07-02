import {
    get,
} from '~utils/storage';

const getAssetById = async (id) => {
    const key = await get(id);
    if (!key) {
        return null;
    }

    return get(key);
};

export default async function getAsset({
    id,
    key,
} = {}) {
    if (key) {
        return get(key);
    }
    if (id) {
        return getAssetById(id);
    }

    return null;
}
