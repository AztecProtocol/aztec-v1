import BN from 'bn.js';
import {
    getAsset,
} from '~/ui/apis/asset';
import makeToken from '~/ui/utils/makeToken';

export default async function makeAsset(asset) {
    if (!asset) {
        return null;
    }

    let assetObj = asset;

    if (typeof asset === 'string') {
        assetObj = await getAsset(asset);
    } else if (!(asset.scalingFactor instanceof BN)) {
        assetObj = {
            ...asset,
            scalingFactor: new BN(asset.scalingFactor),
        };
    }

    const {
        linkedTokenAddress,
    } = assetObj || {};

    const {
        name,
        icon,
        symbol,
        decimals,
    } = linkedTokenAddress
        ? makeToken(linkedTokenAddress)
        : {};

    return {
        ...assetObj,
        name,
        icon,
        symbol,
        decimals,
    };
}
