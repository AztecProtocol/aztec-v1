import BN from 'bn.js';
import {
    formatNumber,
} from '../format';

export default function noteToTokenValue({
    value,
    scalingFactor,
    decimals,
    format = false,
}) {
    let tokenValue = new BN(value);
    if (scalingFactor) {
        tokenValue = tokenValue.mul(new BN(scalingFactor));
    }

    return formatNumber(tokenValue, decimals, format);
}
