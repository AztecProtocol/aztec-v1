import {
    assets,
} from '~ui/mock/data';

export const getAssets = () => assets;

export const getDomainAssets = (domain) => {
    // exclude blacklist for domain
    console.log('getDomainAssets', domain);
    return assets;
};
