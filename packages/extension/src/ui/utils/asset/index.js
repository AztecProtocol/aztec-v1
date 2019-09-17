import formatValue from './formatValue';
import i18n from '~ui/helpers/i18n';

const name = assetCode => i18n.asset(assetCode);

export {
    formatValue,
    name,
};
