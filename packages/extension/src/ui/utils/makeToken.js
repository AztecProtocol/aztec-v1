import contractMetadataMapping from 'eth-contract-metadata';
import {
    getResourceUrl,
} from '~/utils/versionControl';

const publicResourcePath = getResourceUrl('public');

const formatIconUrl = (icon) => {
    if (!icon) return '';

    return `${publicResourcePath}/tokens/${icon}`;
};

export default function makeToken(address) {
    const {
        name = '',
        symbol = '',
        decimals = 0,
        logo = '',
    } = contractMetadataMapping[address] || {};

    return {
        name,
        symbol,
        decimals,
        icon: formatIconUrl(logo),
    };
}
