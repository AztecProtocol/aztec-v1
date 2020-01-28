import BN from 'bn.js';
import formatNumber from './formatNumber';

export default function noteValueToToken(noteValue, asset, format = true) {
    const {
        scalingFactor,
        decimals,
    } = asset;

    let tokenValue = new BN(noteValue);
    if (scalingFactor) {
        tokenValue = scalingFactor.mul(tokenValue);
    }

    return format
        ? formatNumber(tokenValue, decimals)
        : tokenValue;
}
