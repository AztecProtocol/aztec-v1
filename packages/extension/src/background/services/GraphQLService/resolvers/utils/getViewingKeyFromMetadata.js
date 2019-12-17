import metadata from '~/utils/metadata';
import AuthService from '~/background/services/AuthService';

export default async function getViewingKeyFromMetadata(metadataStr) {
    if (!metadataStr) {
        return '';
    }
    const {
        address,
    } = await AuthService.getCurrentUser();
    const {
        viewingKey,
    } = metadata(metadataStr).getAccess(address) || {};

    return viewingKey || '';
}
