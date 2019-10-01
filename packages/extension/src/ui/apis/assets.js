import {
    assets,
} from '~ui/mock/data';

export const getAssets = () => assets;

export // exclude blacklist for domain
const getDomainAssets = domain => assets;
