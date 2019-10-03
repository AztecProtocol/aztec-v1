import {
    assets,
} from '~ui/mock/data';
import apollo from '~ui/apis/helpers/apollo';
import {
    getCurrentUser,
} from '~ui/apis/auth';

export const getLinkedTokenAddress = async (assetAddress) => {
    const currentAddress = await getCurrentUser();
    const {
        asset,
    } = await apollo.query(`
        asset(id: "${assetAddress}", currentAddress: "${currentAddress}") {
            linkedTokenAddress
        }
    `) || {};

    return asset && asset.linkedTokenAddress;
};

export const getAssets = () => assets;

export const getDomainAssets = () => assets;

export const getPastTransactions = () => [];
