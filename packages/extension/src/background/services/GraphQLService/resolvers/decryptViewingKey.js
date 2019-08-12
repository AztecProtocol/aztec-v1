import AuthService from '~background/services/AuthService';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function decryptViewingKey(viewingKey, ownerAddress) {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession(ownerAddress);
    const privateKey = decodePrivateKey(keyStore, pwDerivedKey);

    return fromHexString(viewingKey).decrypt(privateKey);
}
