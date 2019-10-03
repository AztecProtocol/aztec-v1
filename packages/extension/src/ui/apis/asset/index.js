import {
    assets,
} from '~ui/mock/data';
import getLinkedTokenAddress from './getLinkedTokenAddress';
import confidentialTransfer from './confidentialTransfer';

export const getAssets = () => assets;

export const getDomainAssets = () => assets;

export const getPastTransactions = () => [];

export {
    getLinkedTokenAddress,
    confidentialTransfer,
};
