import contractMetadataMapping from 'eth-contract-metadata';
import urls from '~/config/urls';

const formatIconUrl = (icon) => {
    if (!icon) return '';

    return `${urls.public}/tokens/${icon}`;
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
