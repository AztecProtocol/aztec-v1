import {
    assets,
} from '~ui/mock/data';
import getLinkedTokenAddress from './getLinkedTokenAddress';
import confidentialTransferFrom from './confidentialTransferFrom';
import confidentialTransfer from './confidentialTransfer';
import updateNoteMetadata from './updateNoteMetadata';

export const getAssets = () => assets;

export const getDomainAssets = () => assets;

export const getPastTransactions = () => [];

export {
    getLinkedTokenAddress,
    confidentialTransferFrom,
    confidentialTransfer,
    updateNoteMetadata,
};
