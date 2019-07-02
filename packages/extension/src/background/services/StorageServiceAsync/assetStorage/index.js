import {
    get,
    lock,
} from '~utils/storage';
import setAssetIdKeyMapping from './setAssetIdKeyMapping';

export default {
    async createOrUpdate(asset) {
        const {
            id: assetId,
        } = asset;

        const assetKey = await lock(
            'assetCount',
            async () => {
                let key = await get(assetId);
                if (!key) {
                    key = await setAssetIdKeyMapping(asset);
                }
                return key;
            },
        );

        // TODO - save other asset info

        return {
            ...asset,
            key: assetKey,
        };
    },
};
