import metadata from '~/utils/metadata';
import AuthService from '~/background/services/AuthService';
import decryptViewingKey from './decryptViewingKey';

export default async function getDecryptedViewingKeyFromMetadata(metadataStr) {
    const {
        address,
    } = await AuthService.getCurrentUser();
    const {
        viewingKey,
    } = metadata(metadataStr).getAccess(address) || {};
    if (!viewingKey) {
        return '';
    }

    return decryptViewingKey(viewingKey, address);
}
