import {
    metadata,
} from '@aztec/note-access';
import AuthService from '~/background/services/AuthService';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';

export default async function getViewingKeyFromMetadata(metadataStr) {
    if (!metadataStr) {
        return '';
    }
    const {
        address,
    } = await AuthService.getCurrentUser();
    const {
        viewingKey,
    } = metadata(metadataStr.slice(METADATA_AZTEC_DATA_LENGTH + 2)).getAccess(address) || {};

    return viewingKey || '';
}
