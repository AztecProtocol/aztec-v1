import {
    get,
    set,
} from '../../utils/storage';
import dataToKey from '../../utils/dataToKey';
import Storage from './Storage';

const createAssetIdKeyMap = async (asset) => {
    const {
        id: assetId,
    } = asset;
    const assetCount = await get('assetCount') || 0;
    const assetKey = dataToKey('asset', {
        count: assetCount,
    });

    await set({
        [assetId]: assetKey,
        assetCount: assetCount + 1,
    });

    return assetKey;
};

class AssetStorage extends Storage {
    async createOrUpdate(asset) {
        const {
            id: assetId,
        } = asset;

        const assetKey = await this.lock(
            'assetCount',
            async () => {
                let key = await get(assetId);
                if (!key) {
                    key = await createAssetIdKeyMap(asset);
                }
                return key;
            },
        );

        // TODO - save other asset info

        return {
            ...asset,
            key: assetKey,
        };
    }
}

export default new AssetStorage();
