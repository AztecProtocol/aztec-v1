import {
    numberOfAssets,
    entityId,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';

const assets = [];
for (let i = 0; i < numberOfAssets; i += 1) {
    assets.push({
        id: entityId('asset', i),
        address: `asset_address_${i}`,
    });
}

const getFetchConditions = makeGetFetchConditions([
    'id',
]);

export const getAsset = (_, args) => {
    const conditions = getFetchConditions(args);
    return findEntityByKey(assets, conditions);
};

export const getAssetById = assetId =>
    getAsset(null, { id: assetId });

export default assets;
