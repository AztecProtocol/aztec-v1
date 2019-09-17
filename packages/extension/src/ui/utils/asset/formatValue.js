import numeral from 'numeral';
import config from '~ui/config/assets';

export default function formatValue(assetCode, value) {
    const {
        decimal,
    } = config[assetCode] || {};
    let format = '0,0';
    if (decimal !== 0) {
        const hasDecimal = (value | 0) !== value; // eslint-disable-line no-bitwise
        if (hasDecimal) {
            const trailingZero = '0'.padEnd((decimal || `${value}`.length) - 1, '0');
            format = `0,0.0[${trailingZero}]`;
        }
    }

    return numeral(value).format(format);
}
