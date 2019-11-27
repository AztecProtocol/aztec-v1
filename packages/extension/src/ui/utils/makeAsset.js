import {
    getLinkedTokenAddress,
} from '~/ui/apis/asset';
import makeToken from '~/ui/utils/makeToken';

export default async function makeAsset(asset) {
    if (!asset) {
        return null;
    }

    let address;
    let linkedTokenAddress;

    if (typeof asset === 'string') {
        address = asset;
    } else {
        ({
            address,
            linkedTokenAddress,
        } = asset);
    }

    if (!linkedTokenAddress) {
        linkedTokenAddress = await getLinkedTokenAddress(address);
    }

    const {
        name,
        icon,
        symbol,
        decimals,
    } = makeToken(linkedTokenAddress);

    return {
        address,
        linkedTokenAddress,
        name,
        icon,
        symbol,
        decimals,
    };
}
