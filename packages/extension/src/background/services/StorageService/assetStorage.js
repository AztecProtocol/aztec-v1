import {
    get,
    set,
} from '~utils/storage';
import dataKey from '~utils/dataKey';
import Storage from './Storage';

class AssetStorage extends Storage {
    async createOrUpdate(asset) {
        if (this.locked) {
            return this.waitInQueue({
                method: 'createOrUpdate',
                args: [asset],
            });
        }

        const {
            id: assetId,
        } = asset;
        let assetKey = await get(assetId);
        if (!assetKey) {
            const assetCount = await get('assetCount') || 0;
            assetKey = dataKey('asset', {
                count: assetCount,
            });

            await set({
                [assetId]: assetKey,
                assetCount: assetCount + 1,
            });
        }

        // TODO - save other asset info

        this.locked = false;
        this.nextInQueue();

        return {
            ...asset,
            key: assetKey,
        };
    }
}

export default new AssetStorage();
