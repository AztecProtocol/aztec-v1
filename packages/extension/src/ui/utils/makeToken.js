import contractMetadataMapping from 'eth-contract-metadata';

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
        icon: logo,
    };
}
