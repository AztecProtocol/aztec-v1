import formatValue from './formatValue';
import icon from './icon';
import i18n from '~ui/helpers/i18n';

const name = assetCode => i18n.asset(assetCode);

export {
    formatValue,
    icon,
    name,
};
