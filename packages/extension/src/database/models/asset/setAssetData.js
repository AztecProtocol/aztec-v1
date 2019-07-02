import {
    get,
    set,
    lock,
} from '~utils/storage';
import errorAction from '~database/utils/errorAction';

export default async function setAssetData(
    asset,
    {
        forceUpdate = false,
        ignoreDuplicate = false,
    },
) {
    const {
        key,
        id,
        ...data
    } = asset;

    if (!key) {
        return errorAction("'key' must be presented to save asset data");
    }

    return lock(
        key,
        async () => {
            const existingAsset = await get(key);
            if (existingAsset) {
                if (ignoreDuplicate) {
                    return {
                        data: {
                            [key]: existingAsset,
                        },
                        modified: [],
                    };
                }
                if (!forceUpdate) {
                    const info = id ? `id "${id}"` : `key "${key}"`;
                    return errorAction(`Asset with ${info} already exists.`);
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
