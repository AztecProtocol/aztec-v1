import {
    permissionError,
} from '~/utils/error';
import AuthService from '~/background/services/AuthService';

export default async function validateExtension(_, args) {
    const keyStore = await AuthService.getKeyStore();
    if (!keyStore) {
        const {
            currentAddress,
        } = args;
        return permissionError('extension.not.registered', {
            currentAddress,
        });
    }

    return {
        keyStore,
    };
}
