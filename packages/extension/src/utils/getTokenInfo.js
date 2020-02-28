import contractMetadataMapping from 'eth-contract-metadata';
import tokenConfig from '~/config/token';
import {
    getResourceUrl,
} from '~/utils/versionControl';

const publicResourcePath = getResourceUrl('public');

const formatIconUrl = (icon) => {
    if (!icon) return '';

    return `${publicResourcePath}/tokens/${icon}`;
};

export default function getTokenInfo(address) {
    const {
        name = '',
        symbol = '',
        decimals = 0,
        logo = '',
    } = tokenConfig[address] || contractMetadataMapping[address] || {};

    return {
        name,
        symbol,
        decimals,
        icon: formatIconUrl(logo),
    };
}
