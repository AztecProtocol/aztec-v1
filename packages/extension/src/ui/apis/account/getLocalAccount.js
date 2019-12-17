import AuthService from '~/background/services/AuthService';
import {
    getSession,
} from '~/ui/apis/auth';

export default async function getLocalAccount() {
    const keyStore = await AuthService.getKeyStore();
    if (!keyStore) {
        return null;
    }

    const linkedPublicKey = keyStore.privacyKeys.publicKey;
    const {
        address,
        valid: validSession,
    } = await getSession();

    return {
        address,
        linkedPublicKey,
        validSession,
    };
}
