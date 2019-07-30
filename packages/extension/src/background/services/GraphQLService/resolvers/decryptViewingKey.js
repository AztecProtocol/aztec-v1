import AuthService from '~background/services/AuthService';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';

export default async function decryptViewingKey(viewingKey, ownerAddress) {
    const privateKey = await AuthService.getPrivateKey(ownerAddress);
    return fromHexString(viewingKey).decrypt(privateKey);
}
