import secp256k1 from '@aztec/secp256k1';
import AuthService from '~/background/services/AuthService';
import decodePrivateKey from '~/background/utils/decodePrivateKey';
import {
    errorLog,
    warnLog,
} from '~/utils/log';

export default async function retrieveSigningInfo(ownerAddress) {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession(ownerAddress) || {};
    if (!keyStore || !pwDerivedKey) {
        warnLog(`there is no keyStore or pwDerivedKey for this address: ${ownerAddress}`);
        return null;
    }
    try {
        const privateKey = '0x'.concat(decodePrivateKey(keyStore, pwDerivedKey));
        const account = secp256k1.accountFromPrivateKey(privateKey);
        return {
            address: account.address,
            privateKey: account.privateKey,
        };
    } catch (e) {
        errorLog('retrieveSigningInfo error: ', e);
        return null;
    }
}
