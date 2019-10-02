import config from '~ui/config/tokens';
import formatNumber from '~ui/utils/formatNumber';

export default function formatValue(code, value) {
    const {
        decimal,
    } = config[code] || {};

    return formatNumber(value, decimal);
}
