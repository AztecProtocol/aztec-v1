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
    }

    const {
        linkedTokenAddress,
    } = assetObj || {};
    if (!linkedTokenAddress) {
        return null;
    }

    const {
        name,
        icon,
        symbol,
        decimals,
    } = makeToken(linkedTokenAddress);

    return {
        ...assetObj,
        name,
        icon,
        symbol,
        decimals,
    };
}
