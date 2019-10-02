import formatNumber from '~ui/utils/formatNumber';
import {
    formatValue as formatTokenValue,
} from '~ui/utils/token';

export default function formatValue(code, value, scalingFactor) {
    return scalingFactor
        ? formatNumber(value) // TODO - format value using scalingFactor
        : formatTokenValue(code, value);
}
