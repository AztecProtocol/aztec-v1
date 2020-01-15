import makeToken from '~/ui/utils/makeToken';

export default function makeAsset(asset) {
    if (!asset || typeof asset !== 'object') {
        return null;
    }

    const {
        linkedTokenAddress,
    } = asset || {};

    const {
        name,
        icon,
        symbol,
        decimals,
    } = linkedTokenAddress
        ? makeToken(linkedTokenAddress)
        : {};

    return {
        ...asset,
        name,
        icon,
        symbol,
        decimals,
    };
}
