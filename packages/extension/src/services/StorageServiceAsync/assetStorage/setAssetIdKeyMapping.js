import {
    get,
    set,
} from '~utils/storage';
import dataToKey from '~utils/dataToKey';

export default async function setAssetIdKeyRef(asset) {
    const {
        id,
    } = asset;

    let assetKey = await get(id);
    if (assetKey) {
        return assetKey;
    }

    const assetCount = await get('assetCount') || 0;
    assetKey = dataToKey('asset', {
        count: assetCount,
    });

    await set({
        [id]: assetKey,
        assetCount: assetCount + 1,
    });

    return assetKey;
}
