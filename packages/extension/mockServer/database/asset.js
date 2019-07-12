import {
    numberOfAssets,
    enitityAddress,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';

const assets = [];
for (let i = 0; i < numberOfAssets; i += 1) {
    const address = enitityAddress('asset', i);
    assets.push({
        id: address,
        address,
    });
}

const getFetchConditions = makeGetFetchConditions([
    'id',
]);

export const getAsset = (_, args) => {
    const conditions = getFetchConditions(args);
    return findEntityByKey(assets, conditions);
};

export const getAssetById = assetId => getAsset(null, { id: assetId });

export default assets;
