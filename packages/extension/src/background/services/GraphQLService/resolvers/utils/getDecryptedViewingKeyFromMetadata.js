import {
    metadata,
} from '@aztec/note-access';
import {
    METADATA_AZTEC_DATA_LENGTH,
} from '~/config/constants';
import AuthService from '~/background/services/AuthService';
import decryptViewingKey from './decryptViewingKey';

export default async function getDecryptedViewingKeyFromMetadata(metadataStr) {
    const {
        address,
    } = await AuthService.getCurrentUser();
    const {
        viewingKey,
    } = metadata(metadataStr.slice(METADATA_AZTEC_DATA_LENGTH + 2)).getAccess(address) || {};
    if (!viewingKey) {
        return '';
    }

    return decryptViewingKey(viewingKey, address);
}
