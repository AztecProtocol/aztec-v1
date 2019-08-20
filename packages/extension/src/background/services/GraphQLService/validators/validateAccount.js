import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';
import SyncService from '~background/services/SyncService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';

export default async function validateAccount(_, args, ctx) {
    const {
        currentAddress,
    } = args;

    const user = await AuthService.getRegisteredUser(currentAddress);
    if (!user) {
        return permissionError('account.not.linked');
    }

    const {
        keyStore,
        session,
    } = ctx;
    const {
        pwDerivedKey,
    } = session || {};

    let decodedKeyStore;
    try {
        decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    } catch (error) {
        return permissionError('account.incorrect.password', error);
    }

    SyncService.syncAccount({
        address: user.address,
        privateKey: decodePrivateKey(decodedKeyStore, pwDerivedKey),
    });

    const newSession = await AuthService.updateSession(currentAddress);

    return {
        keyStore: decodedKeyStore,
        session: newSession,
        user,
    };
}
